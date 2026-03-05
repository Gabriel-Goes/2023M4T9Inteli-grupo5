import { DEVICE_CONFIGS, IPT_SENSOR_CATALOG } from "../config/devices";
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
        <h3>Contrato proposto para o canal IPT multi-sensor</h3>
        <pre>
{`{
  "device_id": "<uuid>",
  "created_at": "2026-03-05T18:25:00Z",
  "payload": {
    "sensor_type_id": "0|1|dt20b|load_cell|bme280",
    "sensor_label": "deslocamento",
    "value": 12.37,
    "unit": "mm",
    "timestamp": "2026-03-05T18:24:59Z"
  }
}`}
        </pre>

        <h3>Formato alternativo (compatível com payload Ubidots)</h3>
        <pre>
{`{
  "device_id": "<uuid>",
  "created_at": "2026-03-05T18:25:00Z",
  "payload": {
    "sensor_type_id": [{"value": 0}],
    "displacement_mm": [{"value": 3.42}],
    "temperature": [{"value": 28.8}],
    "humidity": [{"value": 62.5}]
  }
}`}
        </pre>

        <h3>Sensores suportados no parser local</h3>
        <table className="sensor-table">
          <thead>
            <tr>
              <th>sensor_type_id</th>
              <th>Label</th>
              <th>Campo principal</th>
              <th>Unidade esperada</th>
            </tr>
          </thead>
          <tbody>
            {IPT_SENSOR_CATALOG.map((sensor) => (
              <tr key={sensor.id}>
                <td>
                  <code>{sensor.id}</code>
                </td>
                <td>{sensor.label}</td>
                <td>
                  <code>{sensor.transportValue}</code>
                </td>
                <td>{sensor.expectedUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
};
