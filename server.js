const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
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

  const queue = [];
  let upstreamOpen = false;

  const upstream = new WebSocket(UPSTREAM_URL);

  upstream.on("open", () => {
    console.log("Upstream connected");
    upstreamOpen = true;

    // Send anything that arrived while upstream was connecting
    for (const packet of queue) {
      upstream.send(packet.data, {
        binary: packet.isBinary
      });
    }

    queue.length = 0;
  });

  client.on("message", (data, isBinary) => {
    if (upstreamOpen && upstream.readyState === WebSocket.OPEN) {
      upstream.send(data, {
        binary: isBinary
      });
    } else if (upstream.readyState === WebSocket.CONNECTING) {
      queue.push({
        data,
        isBinary
      });
    }
  });

  upstream.on("message", (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, {
        binary: isBinary
      });
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

    upstreamOpen = false;

    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });

  client.on("error", (err) => {
    console.log("Client error:", err.message);

    if (
      upstream.readyState === WebSocket.OPEN ||
      upstream.readyState === WebSocket.CONNECTING
    ) {
      upstream.close();
    }
  });

  upstream.on("error", (err) => {
    console.log("Upstream error:", err.message);

    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay listening on port ${PORT}`);
});
