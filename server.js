const http = require("http");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Relay server is running!");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
});
