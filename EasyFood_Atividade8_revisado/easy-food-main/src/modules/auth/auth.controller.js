const authService = require("./auth.service");

function handleUploadError(res, error) {
  return res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : "Erro interno no processamento da imagem"
  });
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios" });
  }

  try {
    const user = await authService.register({ name, email, password });
    res.status(201).json(user);
  } catch (error) {
    // Erro comum: e-mail duplicado (violação do @unique)
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
  }

  try {
    const result = await authService.login({ email, password });

    if (!result) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function uploadProfileImage(req, res) {
  try {
    const user = await authService.updateProfileImage(req.user.id, req.file);
    return res.status(200).json({ message: "Imagem de perfil atualizada com sucesso", user });
  } catch (error) {
    return handleUploadError(res, error);
  }
}

module.exports = { register, login, uploadProfileImage };