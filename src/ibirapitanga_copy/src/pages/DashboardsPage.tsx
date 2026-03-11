import { startTransition, useEffect, useMemo, useState } from "react";

import { createOfficialDeviceConfig } from "../config/devices";
import { DeviceCard } from "../components/DeviceCard";

import type { OfficialDeviceSummary, PaginatedResponse } from "../types";

const MAX_PAGES = 10;

const readErrorMessage = async (response: Response): Promise<string> => {
  const rawText = await response.text();
  if (!rawText) {
    return `Erro HTTP ${response.status}`;
  }

  try {
    const parsed = JSON.parse(rawText) as { message?: string };
    return parsed.message || rawText;
  } catch {
    return rawText;
  }
};

const fetchAllDevices = async (signal: AbortSignal): Promise<OfficialDeviceSummary[]> => {
  const devices = new Map<string, OfficialDeviceSummary>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetch(`/api/devices?page=${page}`, { signal });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as PaginatedResponse<OfficialDeviceSummary>;
    const entries = Array.isArray(payload.data) ? payload.data : [];

    entries.forEach((device) => {
      if (device && typeof device.id === "string" && typeof device.name === "string") {
        devices.set(device.id, device);
      }
    });

    const perPage = payload.pager?.per_page ?? entries.length;
    if (entries.length === 0 || entries.length < perPage) {
      break;
    }
  }

  return [...devices.values()];
};

export const DashboardsPage = () => {
  const [devices, setDevices] = useState<OfficialDeviceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAllDevices(controller.signal);
        startTransition(() => {
          setDevices(result);
        });
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Falha ao carregar devices oficiais");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => controller.abort();
  }, [reloadToken]);

  const dashboardDevices = useMemo(() => devices.map(createOfficialDeviceConfig), [devices]);

  return (
    <section className="page-content">
      <header className="page-header">
        <h2>Dashboards oficiais</h2>
        <p>
          Leitura do backend oficial da Ibirapitanga com proxy local para manter JWT e device API keys fora do
          navegador.
        </p>
      </header>

      <div className="page-toolbar">
        <div className="pill-row">
          <span className="info-pill">Origem: API oficial + stream NRT oficial</span>
          <span className="info-pill">Devices carregados: {dashboardDevices.length}</span>
          <span className="info-pill">Fallback: payload bruto quando o parser ainda não existir</span>
        </div>

        <button className="ghost-button" type="button" onClick={() => setReloadToken((value) => value + 1)} disabled={isLoading}>
          {isLoading ? "Atualizando..." : "Recarregar"}
        </button>
      </div>

      <article className="overview-panel">
        <h3>Estado do ambiente oficial</h3>
        <p>
          O frontend consulta o catálogo de devices pela API oficial e cada card abre o stream via proxy local em
          same-origin. Se o payload ainda não tiver parser dedicado, o card continua útil mostrando o último payload
          bruto recebido.
        </p>
      </article>

      {error && (
        <article className="overview-panel">
          <h3>Falha ao carregar devices oficiais</h3>
          <p>{error}</p>
        </article>
      )}

      {!error && !isLoading && dashboardDevices.length === 0 && (
        <article className="overview-panel">
          <h3>Nenhum device oficial encontrado</h3>
          <p>Verifique o JWT do usuário no proxy local e confirme se a conta possui devices cadastrados na HML.</p>
        </article>
      )}

      <div className="device-grid">
        {dashboardDevices.map((device) => (
          <DeviceCard key={device.slug} device={device} />
        ))}
      </div>
    </section>
  );
};
