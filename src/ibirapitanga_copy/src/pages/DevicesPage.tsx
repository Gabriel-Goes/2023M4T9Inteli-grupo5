import { DEVICE_CONFIGS } from "../config/devices";
import { DeviceCard } from "../components/DeviceCard";

export const DevicesPage = () => {
  return (
    <section className="page-content">
      <header className="page-header">
        <h2>Inventário de dispositivos</h2>
        <p>
          Mapeamento de contratos por device para alinhar integração de protocolo e payload com os desenvolvedores da
          Ibirapitanga.
        </p>
      </header>

      <div className="device-list">
        {DEVICE_CONFIGS.map((device) => (
          <DeviceCard key={device.slug} device={device} compact />
        ))}
      </div>

      <article className="contract-panel">
        <h3>Contrato proposto para o novo canal IPT</h3>
        <pre>
{`{
  "device_id": "<uuid>",
  "created_at": "2026-03-05T18:25:00Z",
  "payload": {
    "sensor_type_id": "dt20b|load_cell|...",
    "sensor_label": "deslocamento",
    "value": 12.37,
    "unit": "mm",
    "timestamp": "2026-03-05T18:24:59Z"
  }
}`}
        </pre>
      </article>
    </section>
  );
};
