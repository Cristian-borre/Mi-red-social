const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
dotenv.config();

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const messageRoutes = require("./routes/messages");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err));

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Lista de usuarios conectados
let connectedUsers = [];

// Socket.IO: Mensajes en tiempo real
io.on("connection", (socket) => {

  // Registrar un usuario al conectar
  socket.on("register", ({ username }) => {
    let existingUser = connectedUsers.find((user) => user.username === username);

    if (existingUser) {
      // Actualizamos el socketId si ya existe
      existingUser.socketId = socket.id;
      existingUser.active = true;
    } else {
      // Si no existe, lo añadimos a la lista
      connectedUsers.push({ username, socketId: socket.id, active: true });
    }

    // Emitir la lista de usuarios actualizada
    io.emit("user_list", connectedUsers);
  });

  // Manejar el envío de mensajes
  socket.on("send_message", ({ sender, recipient, content }) => {
    const targetUser = connectedUsers.find((user) => user.username === recipient);

    if (targetUser && targetUser.active) {
      io.to(targetUser.socketId).emit("receive_message", { sender, content, _id: uuidv4() });
    }
  });

  // Desconexión del usuario
  socket.on("disconnect", () => {
    const user = connectedUsers.find((user) => user.socketId === socket.id);

    if (user) {
      user.active = false;
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
