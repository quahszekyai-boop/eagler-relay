const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });
  res.end("Eaglercraft WebSocket relay is running.");
});

const wss = new WebSocket.Server({
  server: httpServer
});

wss.on("connection", (client) => {
  console.log("WebSocket client connected");

  client.send("Relay WebSocket connection established.");

  client.on("message", (message) => {
    console.log("Received WebSocket data:", message.length, "bytes");
  });

  client.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  client.on("error", (err) => {
    console.log("WebSocket error:", err.message);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP/WebSocket server listening on port ${PORT}`);
});
