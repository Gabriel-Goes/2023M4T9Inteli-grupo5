import { DEVICE_CONFIGS } from "../config/devices";
import { DeviceCard } from "../components/DeviceCard";

const dashboardDevices = DEVICE_CONFIGS;

export const DashboardPage = () => {
  return (
    <section className="page-content">
      <header className="page-header">
        <h2>Dashboard em tempo real</h2>
        <p>Replica local focada em UI para evolução conjunta com o time Ibirapitanga.</p>
      </header>

      <div className="device-grid">
        {dashboardDevices.map((device) => (
          <DeviceCard key={device.slug} device={device} />
        ))}
      </div>
    </section>
  );
};
