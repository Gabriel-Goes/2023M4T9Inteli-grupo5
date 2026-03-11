import http from "node:http";

import { WebSocket, WebSocketServer } from "ws";

import { config } from "./config.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const deviceKeyCache = new Map();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, jsonHeaders);
  response.end(JSON.stringify(payload));
};

const parseErrorPayload = async (response) => {
  const rawText = await response.text();
  if (!rawText) {
    return response.statusText || "Erro inesperado";
  }

  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
      return parsed.message;
    }
  } catch {
    return rawText;
  }

  return rawText;
};

const requestOfficialJson = async (pathname, search = "") => {
  const response = await fetch(`${config.apiBaseUrl}${pathname}${search}`, {
    headers: {
      Authorization: `Bearer ${config.userJwt}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new HttpError(response.status, await parseErrorPayload(response));
  }

  return response.json();
};

const isKeyUsable = (apiKey) => {
  if (!apiKey || typeof apiKey !== "object") {
    return false;
  }

  if (apiKey.revoked_at) {
    return false;
  }

  if (!apiKey.expires_at) {
    return true;
  }

  const expiresAt = Date.parse(apiKey.expires_at);
  return !Number.isFinite(expiresAt) || expiresAt > Date.now();
};

const resolveDeviceApiKey = async (deviceId) => {
  const cached = deviceKeyCache.get(deviceId);
  if (cached && isKeyUsable(cached)) {
    return cached.token;
  }

  const response = await requestOfficialJson(`/devices/${deviceId}/api-keys`);
  const apiKeys = Array.isArray(response.data) ? response.data : [];
  const usableKey = apiKeys.find((candidate) => isKeyUsable(candidate) && typeof candidate.token === "string");

  if (!usableKey) {
    throw new HttpError(404, `Nenhuma device_api_key valida encontrada para ${deviceId}`);
  }

  deviceKeyCache.set(deviceId, usableKey);
  return usableKey.token;
};

const openUpstreamStream = async (client, deviceId) => {
  const deviceApiKey = await resolveDeviceApiKey(deviceId);
  const upstreamUrl = `${config.wsBaseUrl}/v1/devices/${deviceId}/telemetry`;
  const upstream = new WebSocket(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${deviceApiKey}`
    }
  });

  upstream.on("message", (payload, isBinary) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload, { binary: isBinary });
    }
  });

  upstream.on("close", (code, reasonBuffer) => {
    const reason = Buffer.isBuffer(reasonBuffer) ? reasonBuffer.toString("utf-8") : String(reasonBuffer || "");
    if (client.readyState === WebSocket.OPEN) {
      client.close(code || 1000, reason || "Stream oficial encerrado");
    }
  });

  upstream.on("error", (error) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ proxy_error: `Falha no stream oficial: ${error.message}` }));
      client.close(1011, "Falha no stream oficial");
    }
  });

  client.on("close", () => {
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
      upstream.close();
    }
  });

  client.on("error", () => {
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
      upstream.terminate();
    }
  });
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        status: "ok",
        api_base_url: config.apiBaseUrl,
        ws_base_url: config.wsBaseUrl
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/devices") {
      const page = url.searchParams.get("page") || "1";
      const payload = await requestOfficialJson("/devices", `?page=${encodeURIComponent(page)}`);
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/dashboards") {
      const page = url.searchParams.get("page") || "1";
      const payload = await requestOfficialJson("/dashboards", `?page=${encodeURIComponent(page)}`);
      sendJson(response, 200, payload);
      return;
    }

    sendJson(response, 404, { message: "Not found" });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erro interno do proxy";

    if (status === 401 || status === 403) {
      deviceKeyCache.clear();
    }

    sendJson(response, status, { message });
  }
});

const wsServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (!url.pathname.startsWith("/nrt/")) {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (client) => {
    wsServer.emit("connection", client, request);
  });
});

wsServer.on("connection", async (client, request) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
  const deviceId = decodeURIComponent(url.pathname.replace(/^\/nrt\//, ""));

  try {
    await openUpstreamStream(client, deviceId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao conectar no stream oficial";

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ proxy_error: message }));
      client.close(1011, message);
    }
  }
});

server.listen(config.port, config.host, () => {
  console.log(`official proxy listening on http://${config.host}:${config.port}`);
});
