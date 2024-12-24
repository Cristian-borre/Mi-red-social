const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Obtener mensajes entre dos usuarios
router.get("/:sender/:recipient?", authMiddleware, async (req, res) => {
  const { sender, recipient } = req.params;
  try {
    let messages;

    if (recipient) {
      // Buscar mensajes entre 'sender' y 'recipient'
      messages = await Message.find({
        $or: [
          { sender, recipient },
          { sender: recipient, recipient: sender },
        ],
      }).sort({ createdAt: 1 });
    } else {
      // Buscar mensajes donde 'sender' sea igual a 'sender' o 'recipient'
      messages = await Message.find({
        $or: [{ sender }, { recipient: sender }],
      }).sort({ createdAt: 1 });
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { sender, recipient, content } = req.body;

  try {
    // Validar si los usuarios existen
    const senderUser = await User.findOne({ username: sender });
    const recipientUser = await User.findOne({ username: recipient });

    if (!senderUser || !recipientUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Validar roles
    if (senderUser.role === "user" && recipientUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Los usuarios solo pueden enviar mensajes al administrador" });
    }

    if (senderUser.role === "admin" && recipientUser.role !== "user") {
      return res
        .status(403)
        .json({ error: "El administrador solo puede enviar mensajes a usuarios" });
    }

    // Crear el mensaje
    const newMessage = new Message({ sender, recipient, content });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el mensaje" });
  }
});

module.exports = router;
