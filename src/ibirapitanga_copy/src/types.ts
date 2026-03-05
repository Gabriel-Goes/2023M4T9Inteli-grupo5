export type DeviceSlug = "barulhometro" | "aup" | "proantar" | "callithrix" | "ipt";

export interface WsMessage<TPayload = Record<string, unknown>> {
  device_id?: string;
  created_at?: string;
  payload?: TPayload;
}

export interface MetricDisplay {
  label: string;
  value: number;
  unit: string;
  precision?: number;
}

export interface ParsedDeviceData {
  metrics: MetricDisplay[];
  primary: number | null;
  timestamp: number;
}

export interface DeviceConfig {
  slug: DeviceSlug;
  name: string;
  description: string;
  route: string;
  color: string;
  deviceId?: string;
  parse: (message: WsMessage) => ParsedDeviceData | null;
}

export interface IPTPayload {
  sensor_type_id: string;
  sensor_label?: string;
  value: number;
  unit: string;
  timestamp: string;
}

export type ConnectionStatus = "disabled" | "connecting" | "no-data" | "connected" | "error";

export interface DeviceStreamState {
  status: ConnectionStatus;
  metrics: MetricDisplay[];
  history: number[];
  updatedAt: number | null;
  error: string | null;
}
