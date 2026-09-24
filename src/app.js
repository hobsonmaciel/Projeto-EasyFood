import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './modules/auth/auth.routes.js';
import restaurantRoutes from './modules/restaurants/restaurantRoutes.js';
import pageRoutes from './routes/pageRoutes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Assets estáticos: CSS e JavaScript são públicos, mas os HTML continuam
// sendo servidos somente pelas rotas explícitas em pageRoutes.
app.use('/css', express.static(path.join(publicDir, 'css'), {
  index: false,
  fallthrough: false,
  maxAge: '1h'
}));
app.use('/js', express.static(path.join(publicDir, 'js'), {
  index: false,
  fallthrough: false,
  maxAge: '1h'
}));

// Alias estável para recursos estáticos do frontend.
app.use('/assets/css', express.static(path.join(publicDir, 'css'), {
  index: false,
  fallthrough: false,
  maxAge: '1h'
}));
app.use('/assets/js', express.static(path.join(publicDir, 'js'), {
  index: false,
  fallthrough: false,
  maxAge: '1h'
}));

// Páginas da aplicação.
app.use(pageRoutes);

// API existente
app.use('/auth', authRoutes);
app.use(restaurantRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Evita deixar rotas arbitrárias "caindo" em alguma página.
app.use((req, res) => {
  const wantsJson = req.path.startsWith('/auth') ||
    req.path.startsWith('/restaurants') ||
    req.path.startsWith('/api') ||
    req.accepts(['html', 'json']) === 'json';

  if (wantsJson) {
    return res.status(404).json({ error: 'Rota não encontrada' });
  }

  return res.status(404).send(`<!doctype html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 - EasyFood</title>
<style>body{font-family:Arial,sans-serif;background:#f1f2f6;color:#2f3542;display:grid;place-items:center;min-height:100vh;margin:0}.card{background:#fff;padding:32px;border-radius:12px;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.08)}a{color:#ff4757;text-decoration:none;font-weight:700}</style></head>
<body><div class="card"><h1>404</h1><p>Essa rota não existe.</p><a href="/">Voltar para o EasyFood</a></div></body>
</html>`);
});

app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
});

export default app;
