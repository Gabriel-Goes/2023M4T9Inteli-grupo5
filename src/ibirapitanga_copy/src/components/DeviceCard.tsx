import type { CSSProperties } from "react";

import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";

import type { DeviceConfig } from "../types";
import { useDeviceStream } from "../hooks/useDeviceStream";

type DeviceCardProps = {
  device: DeviceConfig;
  compact?: boolean;
};

const formatMetric = (value: number, precision = 2): string => {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
};

export const DeviceCard = ({ device, compact = false }: DeviceCardProps) => {
  const stream = useDeviceStream(device);

  return (
    <article className="device-card" style={{ "--device-accent": device.color } as CSSProperties}>
      <header className="device-card-header">
        <div>
          <h2>{device.name}</h2>
          <p>{device.description}</p>
        </div>
        <StatusBadge status={stream.status} />
      </header>

      <div className="device-card-body">
        <Sparkline values={stream.history} stroke={device.color} />

        <div className="metrics-grid">
          {stream.metrics.length === 0 && (
            <div className="metric-cell metric-placeholder">Sem métricas publicadas neste momento.</div>
          )}

          {stream.metrics.map((metric) => (
            <div className="metric-cell" key={`${metric.label}-${metric.unit}`}>
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{formatMetric(metric.value, metric.precision ?? 2)}</strong>
              <span className="metric-unit">{metric.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <footer className="device-card-footer">
          <code>{device.deviceId ? `/nrt/${device.deviceId}` : "deviceId pendente (integração IPT)"}</code>
          {stream.updatedAt ? (
            <time dateTime={new Date(stream.updatedAt).toISOString()}>
              Última atualização: {new Date(stream.updatedAt).toLocaleTimeString("pt-BR")}
            </time>
          ) : (
            <time>Sem eventos recebidos</time>
          )}
          {stream.error && <small>{stream.error}</small>}
        </footer>
      )}
    </article>
  );
};
