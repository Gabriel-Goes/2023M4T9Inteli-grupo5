const parseNumberEnv = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric env ${name}: ${raw}`);
  }
  return parsed;
};

const parseIntEnv = (name, fallback) => {
  const value = parseNumberEnv(name, fallback);
  return Math.trunc(value);
};

const parseStringEnv = (name, fallback = "") => {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : fallback;
};

const mqttHost = parseStringEnv("MQTT_HOST", "");
if (!mqttHost) {
  throw new Error("Missing MQTT_HOST env var");
}

const mqttTopic = parseStringEnv("MQTT_TOPIC", "ipt/lab/uno/telemetry");
if (!mqttTopic) {
  throw new Error("Missing MQTT_TOPIC env var");
}

const scaleDenominator = parseNumberEnv("RAW_MAX", 1023) - parseNumberEnv("RAW_MIN", 0);
if (scaleDenominator === 0) {
  throw new Error("RAW_MAX and RAW_MIN cannot be equal");
}

export const config = {
  serialPort: parseStringEnv("SERIAL_PORT", "/dev/ttyUSB9"),
  serialBaud: parseIntEnv("SERIAL_BAUD", 115200),
  serialReconnectMs: parseIntEnv("SERIAL_RECONNECT_MS", 2000),

  mqttHost,
  mqttPort: parseIntEnv("MQTT_PORT", 1883),
  mqttUsername: parseStringEnv("MQTT_USERNAME", ""),
  mqttPassword: parseStringEnv("MQTT_PASSWORD", ""),
  mqttTopic,
  mqttQos: parseIntEnv("MQTT_QOS", 0),

  wsPort: parseIntEnv("WS_PORT", 8787),
  wsDeviceId: parseStringEnv("WS_DEVICE_ID", "ipt-local-uno"),

  rawMin: parseNumberEnv("RAW_MIN", 0),
  rawMax: parseNumberEnv("RAW_MAX", 1023),
  valueMin: parseNumberEnv("VALUE_MIN", 0),
  valueMax: parseNumberEnv("VALUE_MAX", 20),

  sensorTypeId: parseStringEnv("SENSOR_TYPE_ID", "dt20b"),
  sensorLabel: parseStringEnv("SENSOR_LABEL", "analog_a0"),
  unit: parseStringEnv("UNIT", "mm")
};
