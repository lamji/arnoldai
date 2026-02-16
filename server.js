const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// Initialize Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Allow Socket.IO to handle its own requests
    // (The Server attachment should handle this automatically, but we ensure handler is only called for non-socket requests if needed)
    handler(req, res);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*" }
  });

  // Socket monitoring
  io.on("connection", (socket) => {
    console.log("[Sentinel] Socket client connected:", socket.id);

    // Broadcast logic
    socket.on("knowledge_updated", () => {
      console.log("[Sentinel] Knowledge update received. Broadcasting refetch signal...");
      socket.broadcast.emit("refetch_knowledge");
    });

    socket.on("disconnect", (reason) => {
      // Optional: console.log("[Sentinel] Client disconnected:", reason);
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (Custom Server Active)`);
  });
});
