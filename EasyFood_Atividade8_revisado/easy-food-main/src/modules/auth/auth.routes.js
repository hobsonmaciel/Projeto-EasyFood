const express = require("express");
const controller = require("./auth.controller");
const authService = require("./auth.service");
const authenticate = require("./auth.middleware");
const receiveImage = require("../shared/upload.middleware");

const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await authService.getById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    return res.json({ message: "Você está autenticado!", user });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/me/image", authenticate, receiveImage, controller.uploadProfileImage);

module.exports = router;
