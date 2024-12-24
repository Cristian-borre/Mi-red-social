const express = require("express");
const Post = require("../models/Post");
const { authMiddleware, isAdmin } = require("../middleware/auth");
const router = express.Router();

// Crear una publicación (solo el administrador)
router.post("/", authMiddleware, isAdmin, async (req, res) => {
  const { title, content } = req.body;

  try {
    const newPost = new Post({ title, content, author: req.user.id });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las publicaciones
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username")
      .populate("comments.user", "username")
      .populate("reactions.user", "username")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comentar una publicación
router.post("/:id/comments", authMiddleware, async (req, res) => {
  const { text } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Publicación no encontrada" });

    const comment = { user: req.user.id, text };
    post.comments.push(comment);
    await post.save();

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reaccionar a una publicación
router.post("/:id/reactions", authMiddleware, async (req, res) => {
  const { type } = req.body; // Ejemplo: "like", "love", etc.

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Publicación no encontrada" });

    // Verificar si el usuario ya reaccionó
    const existingReaction = post.reactions.find((reaction) => reaction.user.toString() === req.user.id);
    if (existingReaction) {
      existingReaction.type = type; // Actualizar reacción existente
    } else {
      post.reactions.push({ user: req.user.id, type }); // Agregar nueva reacción
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
