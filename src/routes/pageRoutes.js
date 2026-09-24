import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../../public');

const pages = {
  home: path.join(publicDir, 'index.html'),
  login: path.join(publicDir, 'auth', 'login.html'),
  register: path.join(publicDir, 'auth', 'register.html'),
};

function sendPage(file) {
  return (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(file);
  };
}

router.get('/', sendPage(pages.home));
router.get('/auth', (_req, res) => res.redirect(302, '/auth/login'));
router.get('/auth/login', sendPage(pages.login));
router.get('/auth/register', sendPage(pages.register));

export default router;
