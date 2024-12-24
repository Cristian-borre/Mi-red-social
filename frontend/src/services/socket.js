import { io } from "socket.io-client";

// Configuración del servidor de socket.io
const socket = io("http://localhost:5000"); // Dirección del servidor backend

// Conectar al servidor
socket.on("connect", () => {
  console.log("Conectado al servidor de Socket.io");
});

export default socket;
