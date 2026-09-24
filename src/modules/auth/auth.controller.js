import { registerUser, loginUser } from './auth.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: 'O nome deve ter pelo menos 2 caracteres' });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Informe um e-mail válido' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const user = await registerUser({ name, email, password });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }
    console.error('Erro ao cadastrar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const result = await loginUser({ email, password });
    if (!result) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
