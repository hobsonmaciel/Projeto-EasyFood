import jwt from 'jsonwebtoken';

export function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.sub || !payload.email) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = {
      id: Number(payload.sub),
      email: payload.email
    };

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
