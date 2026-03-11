import { SHOWROOM_DEVICE_CONFIGS } from "../config/devices";
import { DeviceCard } from "../components/DeviceCard";

const dashboardDevices = SHOWROOM_DEVICE_CONFIGS;

export const DashboardPage = () => {
  return (
    <section className="page-content">
      <header className="page-header">
        <h2>Showroom local</h2>
        <p>Vitrine de referência com os cards legados e o canal IPT para comparar UI e parser durante a migração.</p>
      </header>

      <div className="device-grid">
        {dashboardDevices.map((device) => (
          <DeviceCard key={device.slug} device={device} />
        ))}
      </div>
    </section>
  );
};
