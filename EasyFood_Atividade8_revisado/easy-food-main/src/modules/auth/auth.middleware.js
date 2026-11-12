const jwt = require("jsonwebtoken");


function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Espera o formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifica a assinatura e a validade do token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET não configurado no servidor" });
    }

    const payload = jwt.verify(token, secret);
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    // O ID volta a ser numérico para corresponder ao tipo Int do PostgreSQL/Prisma.
    req.user = { id: userId, name: payload.name, email: payload.email };

    next(); // token válido → segue para a rota
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

module.exports = authenticate;