import type {
  DeviceConfig,
  IPTSensorCatalogItem,
  IPTSensorTypeId,
  OfficialDeviceSummary,
  ParsedDeviceData,
  WsMessage
} from "../types";

export const OFFICIAL_WS_BASE_URL =
  import.meta.env.VITE_OFFICIAL_WS_BASE_URL?.trim() || "wss://ws-showroom-ibiraprj.linux.ipt.br";

const resolveSameOriginWsBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return "ws://localhost:5174";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
};

export const LOCAL_PROXY_WS_BASE_URL =
  import.meta.env.VITE_LOCAL_PROXY_WS_BASE_URL?.trim() ||
  import.meta.env.VITE_IPT_WS_BASE_URL?.trim() ||
  resolveSameOriginWsBaseUrl();
const IPT_DEVICE_ID = import.meta.env.VITE_IPT_DEVICE_ID?.trim() || "";

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

const serializePayloadPreview = (payload: unknown): string | null => {
  if (payload === undefined) {
    return null;
  }

  try {
    const serialized = JSON.stringify(payload, null, 2);
    if (!serialized) {
      return null;
    }

    return serialized.length > 640 ? `${serialized.slice(0, 640)}\n...` : serialized;
  } catch {
    return null;
  }
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

const parseRawPayload = (message: WsMessage): ParsedDeviceData => {
  return {
    timestamp: resolveTimestamp(message),
    primary: null,
    metrics: [],
    rawPayload: serializePayloadPreview(message.payload)
  };
};

const withRawFallback = (parser: DeviceConfig["parse"]): DeviceConfig["parse"] => {
  return (message) => parser(message) ?? parseRawPayload(message);
};

const colorFromSeed = (seed: string): string => {
  const palette = ["#ff8a00", "#26a0da", "#42e695", "#f857a6", "#f6d365", "#7bdff2"];
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export const SHOWROOM_DEVICE_CONFIGS: DeviceConfig[] = [
  {
    slug: "barulhometro",
    name: "Barulhometro",
    description: "Medição de ruído em tempo real",
    route: "/showroom",
    color: "#ff8a00",
    deviceId: "c5732948-cd24-42eb-8239-159d8c281ddd",
    parse: parseBarulhometro
  },
  {
    slug: "aup",
    name: "AUP",
    description: "Temperatura, umidade, vento e chuva",
    route: "/showroom",
    color: "#26a0da",
    deviceId: "d434d12b-1a5d-4227-aca6-9d236205475b",
    parse: parseAup
  },
  {
    slug: "proantar",
    name: "Proantar",
    description: "Temperatura de solo antártico",
    route: "/showroom",
    color: "#42e695",
    deviceId: "381d40d1-e63c-484b-bf94-3595f3c296ca",
    parse: parseProantar
  },
  {
    slug: "callithrix",
    name: "Callithrix",
    description: "Temperatura e umidade de campo",
    route: "/showroom",
    color: "#f857a6",
    deviceId: "59e0c2fa-bd5f-4080-918a-0570fb9c5dfa",
    parse: parseCallithrix
  },
  {
    slug: "ipt",
    name: "IPT (multi-sensor)",
    description: "Device oficial do IPT na plataforma Ibirapitanga",
    route: "/showroom",
    color: "#f6d365",
    deviceId: IPT_DEVICE_ID,
    wsBaseUrl: LOCAL_PROXY_WS_BASE_URL,
    parse: parseIpt
  }
];

const SHOWROOM_DEVICE_BY_ID = new Map(
  SHOWROOM_DEVICE_CONFIGS.filter((device) => Boolean(device.deviceId)).map((device) => [device.deviceId as string, device])
);

export const createOfficialDeviceConfig = (device: OfficialDeviceSummary): DeviceConfig => {
  const known = SHOWROOM_DEVICE_BY_ID.get(device.id);

  return {
    slug: device.id,
    name: device.name,
    description: device.description?.trim() || known?.description || "Device oficial listado via API da Ibirapitanga.",
    route: "/dashboards",
    color: known?.color || colorFromSeed(device.id),
    deviceId: device.id,
    wsBaseUrl: LOCAL_PROXY_WS_BASE_URL,
    parse: withRawFallback(known?.parse ?? parseRawPayload)
  };
};

export const findDevice = (slug: DeviceConfig["slug"]): DeviceConfig | undefined => {
  return SHOWROOM_DEVICE_CONFIGS.find((device) => device.slug === slug);
};
