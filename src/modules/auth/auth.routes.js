import { Router } from 'express';
import { register, login } from './auth.controller.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';
import prisma from '../../lib/prisma.js';

const router = Router();

// API de autenticação
router.post('/register', register);
router.post('/login', login);

router.get('/me', verifyJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
