const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

// Replace this only with an authorized WebSocket upstream.
const UPSTREAM_URL = process.env.UPSTREAM_URL;

if (!UPSTREAM_URL) {
  console.error("Missing UPSTREAM_URL environment variable.");
  process.exit(1);
}

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end("WebSocket relay is running.");
});

const wss = new WebSocket.Server({
  server: httpServer
});

wss.on("connection", (client) => {
  console.log("Client connected");

  const upstream = new WebSocket(UPSTREAM_URL);

  upstream.on("open", () => {
    console.log("Upstream connected");
  });

  client.on("message", (data, isBinary) => {
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(data, { binary: isBinary });
    }
  });

  upstream.on("message", (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary });
    }
  });

  client.on("close", () => {
    console.log("Client disconnected");
    if (
      upstream.readyState === WebSocket.OPEN ||
      upstream.readyState === WebSocket.CONNECTING
    ) {
      upstream.close();
    }
  });

  upstream.on("close", () => {
    console.log("Upstream disconnected");
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });

  client.on("error", (err) => {
    console.log("Client error:", err.message);
    upstream.close();
  });

  upstream.on("error", (err) => {
    console.log("Upstream error:", err.message);
    client.close();
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay listening on port ${PORT}`);
});
