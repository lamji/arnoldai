import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  try {
    if (!socket) {
      // Standard Next.js socket path if using pages/api/socket
      socket = io({
        path: "/api/socket",
        reconnectionAttempts: 8,
        timeout: 20000,
        autoConnect: true, // Now safe to auto-connect since server is guaranteed
      });

      console.log("Sentinel: connecting to socket server...");

      socket.on("connect", () => {
        console.log("✅ Sentinel: Socket CONNECTED successfully. ID:", socket?.id);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Sentinel: Socket connection ERROR:", err.message);
      });

      socket.on("disconnect", (reason) => {
        console.warn("⚠️ Sentinel: Socket DISCONNECTED. Reason:", reason);
      });
    }
    return socket;
  } catch (err) {
    console.warn("Sentinel: Socket initialization failed.");
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
    } as any;
  }
};
