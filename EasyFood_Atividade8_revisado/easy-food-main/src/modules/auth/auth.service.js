const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../../database/prisma");
const imageService = require("../shared/image.service");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado no arquivo .env");
  }
  return secret;
}

// Cadastro: guarda o usuário com a senha em hash
async function register({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hash }
  });

  // Nunca devolvemos a senha
  return { id: user.id, name: user.name, email: user.email };
}

// Login: confere o e-mail, compara a senha e gera o token
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null; // usuário não existe
  }

  const senhaConfere = await bcrypt.compare(password, user.password);

  if (!senhaConfere) {
    return null; // senha errada
  }

  // Gera o token com o id e email do usuário, válido por 1 dia
  const token = jwt.sign(
    { sub: String(user.id), name: user.name, email: user.email },
    getJwtSecret(),
    { expiresIn: "1d" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

// Busca os dados atualizados do usuário no banco (sem a senha)
async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl };
}

async function updateProfileImage(userId, file) {
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    const error = new Error("Usuário não encontrado");
    error.statusCode = 404;
    throw error;
  }

  const imageUrl = await imageService.processAndStoreImage(file, "users", userId);
  try {
    const updatedUser = await prisma.user.update({ where: { id: userId }, data: { imageUrl } });
    await imageService.removeStoredImage(currentUser.imageUrl);
    return { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, imageUrl: updatedUser.imageUrl };
  } catch (error) {
    await imageService.removeStoredImage(imageUrl);
    throw error;
  }
}

module.exports = { register, login, getById, updateProfileImage };