const parseStringEnv = (name, fallback = "") => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
};

const parseIntEnv = (name, fallback) => {
  const value = parseStringEnv(name, "");
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const apiBaseUrl = parseStringEnv("IBIRA_API_BASE_URL", "https://api-ibirahml.linux.ipt.br").replace(/\/$/, "");
const wsBaseUrl = parseStringEnv("IBIRA_WS_BASE_URL", "wss://ws-ibirahml.linux.ipt.br").replace(/\/$/, "");
const userJwt = parseStringEnv("IBIRA_USER_JWT", "");

if (!userJwt) {
  throw new Error("Missing IBIRA_USER_JWT env var");
}

export const config = {
  apiBaseUrl,
  wsBaseUrl,
  userJwt,
  host: parseStringEnv("IBIRA_PROXY_HOST", "127.0.0.1"),
  port: parseIntEnv("IBIRA_PROXY_PORT", 8788)
};
