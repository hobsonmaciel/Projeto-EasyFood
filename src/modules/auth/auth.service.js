import prisma from '../../lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

export async function registerUser({ name, email, password }) {
  const normalizedName = String(name).trim();
  const normalizedEmail = normalizeEmail(email);
  const hash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      password: hash
    },
    select: { id: true, name: true, email: true }
  });
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;

  const senhaConfere = await bcrypt.compare(password, user.password);
  if (!senhaConfere) return null;

  const token = jwt.sign(
    { sub: String(user.id), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email }
  };
}
