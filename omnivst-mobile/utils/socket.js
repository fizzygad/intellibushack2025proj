import { io } from "socket.io-client";

// Replace with your backend’s real URL
export const socket = io("https://your-backend-url.com", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
});
