import type { DeviceConfig, ParsedDeviceData, WsMessage } from "../types";

export const WS_BASE_URL = "wss://ws-showroom-ibiraprj.linux.ipt.br";

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const resolveTimestamp = (message: WsMessage): number => {
  const createdAt = typeof message.created_at === "string" ? Date.parse(message.created_at) : NaN;
  return Number.isFinite(createdAt) ? createdAt : Date.now();
};

const parseBarulhometro = (message: WsMessage): ParsedDeviceData | null => {
  const payload = message.payload;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const decibels = asNumber((payload as Record<string, unknown>).decibels);
  if (decibels === null) {
    return null;
  }

  return {
    timestamp: resolveTimestamp(message),
    primary: decibels,
    metrics: [{ label: "Ruído", value: decibels, unit: "dB", precision: 1 }]
  };
};

const parseAup = (message: WsMessage): ParsedDeviceData | null => {
  const payload = message.payload;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const temperature = asNumber(record["aup-t"]);
  const humidity = asNumber(record["aup-h"]);
  const windspeed = asNumber(record["aup-windspeed"]);
  const rainfall = asNumber(record["aup-rainfall"]);
  const decibels = asNumber(record["aup-db"]);

  const metrics = [
    temperature !== null ? { label: "Temperatura", value: temperature, unit: "°C", precision: 2 } : null,
    humidity !== null ? { label: "Umidade", value: humidity, unit: "%", precision: 2 } : null,
    windspeed !== null ? { label: "Vento", value: windspeed, unit: "km/h", precision: 1 } : null,
    rainfall !== null ? { label: "Pluviometria", value: rainfall, unit: "mm/h", precision: 2 } : null,
    decibels !== null ? { label: "Ruído", value: decibels, unit: "dB", precision: 1 } : null
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    timestamp: resolveTimestamp(message),
    primary: temperature,
    metrics
  };
};

const parseCallithrix = (message: WsMessage): ParsedDeviceData | null => {
  const payload = message.payload;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const temperature = asNumber(record.temperature);
  const humidity = asNumber(record.humidity);
  if (temperature === null && humidity === null) {
    return null;
  }

  return {
    timestamp: resolveTimestamp(message),
    primary: temperature,
    metrics: [
      temperature !== null ? { label: "Temperatura", value: temperature, unit: "°C", precision: 2 } : null,
      humidity !== null ? { label: "Umidade", value: humidity, unit: "%", precision: 1 } : null
    ].filter((item): item is NonNullable<typeof item> => item !== null)
  };
};

const parseProantar = (message: WsMessage): ParsedDeviceData | null => {
  const payload = message.payload;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const values = Object.entries(payload as Record<string, unknown>)
    .filter(([key]) => /^m\d+t\d+$/i.test(key))
    .map(([, raw]) => asNumber(raw))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const highest = Math.max(...values);

  return {
    timestamp: resolveTimestamp(message),
    primary: average,
    metrics: [
      { label: "Temperatura média", value: average, unit: "°C", precision: 2 },
      { label: "Maior leitura", value: highest, unit: "°C", precision: 2 },
      { label: "Pontos ativos", value: values.length, unit: "sensores", precision: 0 }
    ]
  };
};

const parseIpt = (): ParsedDeviceData | null => {
  return null;
};

export const DEVICE_CONFIGS: DeviceConfig[] = [
  {
    slug: "barulhometro",
    name: "Barulhometro",
    description: "Medição de ruído em tempo real",
    route: "/dashboard",
    color: "#ff8a00",
    deviceId: "c5732948-cd24-42eb-8239-159d8c281ddd",
    parse: parseBarulhometro
  },
  {
    slug: "aup",
    name: "AUP",
    description: "Temperatura, umidade, vento e chuva",
    route: "/dashboard",
    color: "#26a0da",
    deviceId: "d434d12b-1a5d-4227-aca6-9d236205475b",
    parse: parseAup
  },
  {
    slug: "proantar",
    name: "Proantar",
    description: "Temperatura de solo antártico",
    route: "/dashboard",
    color: "#42e695",
    deviceId: "381d40d1-e63c-484b-bf94-3595f3c296ca",
    parse: parseProantar
  },
  {
    slug: "callithrix",
    name: "Callithrix",
    description: "Temperatura e umidade de campo",
    route: "/dashboard",
    color: "#f857a6",
    deviceId: "59e0c2fa-bd5f-4080-918a-0570fb9c5dfa",
    parse: parseCallithrix
  },
  {
    slug: "ipt",
    name: "IPT (novo)",
    description: "Canal preparado para ESP32 multi-sensor",
    route: "/devices",
    color: "#f6d365",
    parse: parseIpt
  }
];

export const findDevice = (slug: DeviceConfig["slug"]): DeviceConfig | undefined => {
  return DEVICE_CONFIGS.find((device) => device.slug === slug);
};
