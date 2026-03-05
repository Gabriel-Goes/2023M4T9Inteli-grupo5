import type { DeviceConfig, IPTSensorCatalogItem, IPTSensorTypeId, ParsedDeviceData, WsMessage } from "../types";

export const WS_BASE_URL = "wss://ws-showroom-ibiraprj.linux.ipt.br";
const IPT_DEVICE_ID = import.meta.env.VITE_IPT_DEVICE_ID?.trim() || undefined;

const IPT_SENSOR_TYPE_BY_ID: Record<string, IPTSensorTypeId> = {
  "0": "dt20b",
  "1": "load_cell",
  "2": "bme280",
  dt20b: "dt20b",
  load_cell: "load_cell",
  bme280: "bme280",
  strain_gage: "strain_gage",
  displacement: "dt20b",
  lvdt: "dt20b"
};

const IPT_SENSOR_PROFILES: Record<IPTSensorTypeId, { label: string; unit: string; precision: number }> = {
  dt20b: { label: "Deslocamento", unit: "mm", precision: 2 },
  load_cell: { label: "Peso", unit: "kg", precision: 3 },
  bme280: { label: "Temperatura", unit: "°C", precision: 2 },
  strain_gage: { label: "Deformação", unit: "µε", precision: 0 },
  unknown: { label: "Medição", unit: "", precision: 2 }
};

export const IPT_SENSOR_CATALOG: IPTSensorCatalogItem[] = [
  {
    id: "dt20b",
    transportValue: "displacement_mm ou value",
    transportUnit: "mm",
    label: "Transdutor linear DT-20B",
    expectedUnit: "mm"
  },
  {
    id: "load_cell",
    transportValue: "weight_kg ou value",
    transportUnit: "kg",
    label: "Célula de carga",
    expectedUnit: "kg"
  },
  {
    id: "bme280",
    transportValue: "temperature / humidity",
    transportUnit: "°C / %",
    label: "BME280 (ambiente)",
    expectedUnit: "°C e %"
  }
];

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

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
};

const unwrapValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }

    const first = value[0];
    const firstRecord = asRecord(first);
    if (firstRecord && "value" in firstRecord) {
      return firstRecord.value;
    }

    return first;
  }

  const record = asRecord(value);
  if (record && "value" in record) {
    return record.value;
  }

  return value;
};

const asString = (value: unknown): string | null => {
  const unwrapped = unwrapValue(value);

  if (typeof unwrapped === "string") {
    const normalized = unwrapped.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof unwrapped === "number" && Number.isFinite(unwrapped)) {
    return String(unwrapped);
  }

  return null;
};

const asPayloadNumber = (value: unknown): number | null => {
  return asNumber(unwrapValue(value));
};

const resolveIptSensorTypeId = (value: unknown): IPTSensorTypeId => {
  const raw = asString(value);
  if (!raw) {
    return "unknown";
  }

  const normalized = raw.toLowerCase();
  return IPT_SENSOR_TYPE_BY_ID[normalized] ?? "unknown";
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

const parseIpt = (message: WsMessage): ParsedDeviceData | null => {
  const payload = asRecord(message.payload);
  if (!payload) {
    return null;
  }

  const messageTimestamp = resolveTimestamp(message);
  const payloadTimestamp = asString(payload.timestamp);
  const parsedPayloadTimestamp = payloadTimestamp ? Date.parse(payloadTimestamp) : NaN;
  const timestamp = Number.isFinite(parsedPayloadTimestamp) ? parsedPayloadTimestamp : messageTimestamp;

  const sensorTypeId = resolveIptSensorTypeId(payload.sensor_type_id);
  const profile = IPT_SENSOR_PROFILES[sensorTypeId];

  const displacementMm = asPayloadNumber(payload.displacement_mm);
  const weightKg = asPayloadNumber(payload.weight_kg);
  const genericValue = asPayloadNumber(payload.value);
  const temperature = asPayloadNumber(payload.temperature);
  const humidity = asPayloadNumber(payload.humidity);

  const customLabel = asString(payload.sensor_label);
  const customUnit = asString(payload.unit);
  const metrics: ParsedDeviceData["metrics"] = [];

  if (displacementMm !== null) {
    metrics.push({ label: "Deslocamento", value: displacementMm, unit: "mm", precision: 2 });
  } else if (weightKg !== null) {
    metrics.push({ label: "Peso", value: weightKg, unit: "kg", precision: 3 });
  } else if (genericValue !== null) {
    metrics.push({
      label: customLabel ?? profile.label,
      value: genericValue,
      unit: customUnit ?? profile.unit,
      precision: profile.precision
    });
  }

  if (temperature !== null) {
    metrics.push({ label: "Temperatura", value: temperature, unit: "°C", precision: 2 });
  }

  if (humidity !== null) {
    metrics.push({ label: "Umidade", value: humidity, unit: "%", precision: 1 });
  }

  if (metrics.length === 0) {
    return null;
  }

  return {
    timestamp,
    primary: metrics[0]?.value ?? null,
    metrics
  };
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
    name: "IPT (multi-sensor)",
    description: "ESP32 com seleção de sensores por perfil de ensaio",
    route: "/devices",
    color: "#f6d365",
    deviceId: IPT_DEVICE_ID,
    parse: parseIpt
  }
];

export const findDevice = (slug: DeviceConfig["slug"]): DeviceConfig | undefined => {
  return DEVICE_CONFIGS.find((device) => device.slug === slug);
};
