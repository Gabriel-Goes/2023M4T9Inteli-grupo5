import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import mqtt from "mqtt";
import { WebSocketServer } from "ws";

import { config } from "./config.js";

const TARGET_PATH = `/nrt/${config.wsDeviceId}`;

const wsServer = new WebSocketServer({ port: config.wsPort });
const wsPathByClient = new WeakMap();

wsServer.on("connection", (socket, request) => {
  const path = request.url ?? "/";
  wsPathByClient.set(socket, path);

  socket.on("close", () => {
    wsPathByClient.delete(socket);
  });

  socket.on("error", (error) => {
    console.error("[ws] client error:", error.message);
  });

  console.log(`[ws] client connected path=${path}`);
});

wsServer.on("listening", () => {
  console.log(`[ws] listening on ws://0.0.0.0:${config.wsPort}${TARGET_PATH}`);
});

const mqttUrl = `mqtt://${config.mqttHost}:${config.mqttPort}`;
const mqttClient = mqtt.connect(mqttUrl, {
  clientId: config.mqttClientId || undefined,
  username: config.mqttUsername || undefined,
  password: config.mqttPassword || undefined,
  reconnectPeriod: 2000
});

mqttClient.on("connect", () => {
  console.log(`[mqtt] connected ${mqttUrl}`);
  mqttClient.subscribe(config.mqttTopic, { qos: config.mqttQos }, (error) => {
    if (error) {
      console.error("[mqtt] subscribe failed:", error.message);
      return;
    }
    console.log(`[mqtt] subscribed topic=${config.mqttTopic}`);
  });
});

mqttClient.on("reconnect", () => {
  console.log("[mqtt] reconnecting...");
});

mqttClient.on("error", (error) => {
  console.error("[mqtt] error:", error.message);
});

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value, min, max) => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const mapRawToValue = (raw) => {
  const normalized = (raw - config.rawMin) / (config.rawMax - config.rawMin);
  const bounded = clamp(normalized, 0, 1);
  const mapped = config.valueMin + bounded * (config.valueMax - config.valueMin);
  return Number(mapped.toFixed(3));
};

const parseCsvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  if (/^raw\s*,/i.test(trimmed)) {
    return null;
  }

  const cols = trimmed.split(",").map((col) => col.trim());
  if (cols.length < 3) {
    return null;
  }

  const raw = toNumber(cols[0]);
  if (raw === null) {
    return null;
  }

  const tempK = toNumber(cols[1]);
  const tempC = toNumber(cols[2]);
  const tempKEma = toNumber(cols[3]);
  const tempCEma = toNumber(cols[4]);

  const payload = {
    sensor_type_id: config.sensorTypeId,
    sensor_label: config.sensorLabel,
    value: mapRawToValue(raw),
    unit: config.unit,
    timestamp: new Date().toISOString(),
    raw_adc: raw
  };

  const temperature = tempCEma ?? tempC;
  if (temperature !== null) {
    payload.temperature = Number(temperature.toFixed(3));
  }

  if (tempK !== null) {
    payload.temperature_k = Number(tempK.toFixed(3));
  }

  if (tempKEma !== null) {
    payload.temperature_k_ema = Number(tempKEma.toFixed(3));
  }

  return payload;
};

const broadcastEnvelope = (deviceId, payload, createdAt = new Date().toISOString()) => {
  const envelope = {
    device_id: deviceId,
    created_at: createdAt,
    payload
  };

  const message = JSON.stringify(envelope);
  for (const client of wsServer.clients) {
    if (client.readyState !== 1) {
      continue;
    }

    const path = wsPathByClient.get(client);
    if (path !== `/nrt/${deviceId}`) {
      continue;
    }

    client.send(message);
  }
};

mqttClient.on("message", (topic, messageBuffer) => {
  if (topic !== config.mqttTopic) {
    return;
  }

  const raw = messageBuffer.toString("utf8");
  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (parsed.payload && typeof parsed.payload === "object") {
      const deviceId = typeof parsed.device_id === "string" && parsed.device_id.trim()
        ? parsed.device_id.trim()
        : config.wsDeviceId;
      const createdAt = typeof parsed.created_at === "string" ? parsed.created_at : new Date().toISOString();
      broadcastEnvelope(deviceId, parsed.payload, createdAt);
      return;
    }

    broadcastEnvelope(config.wsDeviceId, parsed, new Date().toISOString());
  } catch (error) {
    console.error("[mqtt] invalid JSON payload:", error.message);
  }
});

const publishPayload = (payload) => {
  mqttClient.publish(config.mqttTopic, JSON.stringify(payload), { qos: config.mqttQos }, (error) => {
    if (error) {
      console.error("[mqtt] publish failed:", error.message);
    }
  });
};

let serialPort = null;
let reconnectTimer = null;

const scheduleSerialReconnect = () => {
  if (reconnectTimer !== null) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSerial();
  }, config.serialReconnectMs);
};

const openSerial = () => {
  if (serialPort && serialPort.isOpen) {
    return;
  }

  serialPort = new SerialPort({
    path: config.serialPort,
    baudRate: config.serialBaud,
    autoOpen: false
  });

  const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", (line) => {
    const payload = parseCsvLine(line);
    if (!payload) {
      return;
    }

    publishPayload(payload);
  });

  serialPort.on("open", () => {
    console.log(`[serial] connected port=${config.serialPort} baud=${config.serialBaud}`);
  });

  serialPort.on("error", (error) => {
    console.error("[serial] error:", error.message);
  });

  serialPort.on("close", () => {
    console.log("[serial] closed; scheduling reconnect");
    scheduleSerialReconnect();
  });

  serialPort.open((error) => {
    if (error) {
      console.error("[serial] open failed:", error.message);
      scheduleSerialReconnect();
    }
  });
};

const shutdown = () => {
  console.log("\n[bridge] shutting down...");

  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    wsServer.close();
  } catch {
    // no-op
  }

  try {
    mqttClient.end(true);
  } catch {
    // no-op
  }

  try {
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
  } catch {
    // no-op
  }

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[bridge] starting serial -> mqtt -> ws");
console.log(`[bridge] target topic=${config.mqttTopic} device_id=${config.wsDeviceId}`);
openSerial();
