import type { ConnectionStatus } from "../types";

type StatusBadgeProps = {
  status: ConnectionStatus;
};

const statusText: Record<ConnectionStatus, string> = {
  connecting: "Conectando...",
  connected: "Conectado com a plataforma Ibirapitanga",
  "no-data": "Aguardando o recebimento de dados...",
  disabled: "Stream ainda não configurado",
  error: "Falha de conexão"
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return <span className={`status-badge status-${status}`}>{statusText[status]}</span>;
};
