function getToken() {
  return localStorage.getItem('token');
}

function setStatus(message, type = 'error') {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = message;
  status.className = `status ${type}`;
}

function getSafeRedirect() {
  const value = new URLSearchParams(window.location.search).get('redirect');
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

async function hasValidSession() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (response.ok) return true;
    if (response.status === 401) localStorage.removeItem('token');
    return false;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
}

async function redirectAuthenticatedUser() {
  if (await hasValidSession()) {
    window.location.replace('/');
    return true;
  }
  return false;
}

async function handleLogin(event) {
  event.preventDefault();

  const submitButton = document.getElementById('submitButton');
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  submitButton.disabled = true;
  submitButton.innerHTML = 'Entrando...';
  setStatus('');

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || 'Não foi possível entrar.');
      return;
    }

    if (!data.token) {
      setStatus('O servidor não retornou um token de autenticação.');
      return;
    }

    localStorage.setItem('token', data.token);
    window.location.replace(getSafeRedirect());
  } catch (error) {
    console.error('Erro no login:', error);
    setStatus('Não foi possível conectar ao servidor.');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Entrar <span>→</span>';
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const submitButton = document.getElementById('submitButton');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    setStatus('As senhas não coincidem.');
    return;
  }

  if (password.length < 6) {
    setStatus('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = 'Criando...';
  setStatus('');

  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || 'Não foi possível criar a conta.');
      return;
    }

    const params = new URLSearchParams({ registered: '1', email });
    window.location.replace(`/auth/login?${params.toString()}`);
  } catch (error) {
    console.error('Erro no cadastro:', error);
    setStatus('Não foi possível conectar ao servidor.');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Criar conta <span>→</span>';
  }
}

function configurarTiltAuth() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.tilt-auth').forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';
    const strength = Number(card.dataset.tiltStrength || 5);

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - .5) * strength;
      const rotateX = (0.5 - y) * strength;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    const reset = () => { card.style.transform = ''; };
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  configurarTiltAuth();

  const page = document.body.dataset.page;
  const alreadyAuthenticated = await redirectAuthenticatedUser();
  if (alreadyAuthenticated) return;

  if (page === 'login') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      setStatus('Conta criada com sucesso. Faça login para continuar.', 'success');
      const email = params.get('email');
      if (email) document.getElementById('email').value = email;
    }

    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  }

  if (page === 'register') {
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  }
});
