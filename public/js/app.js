const API = {
  me: '/auth/me',
  restaurants: '/restaurants'
};

let todosRestaurantes = [];
let restauranteEmEdicao = null;

function obterToken() {
  return localStorage.getItem('token');
}

function limparSessao() {
  localStorage.removeItem('token');
}

function escaparHTML(valor) {
  const div = document.createElement('div');
  div.textContent = String(valor);
  return div.innerHTML;
}

function mostrarStatus(mensagem, tipo = 'success') {
  const status = document.getElementById('status');
  if (!status) return;

  status.textContent = mensagem;
  status.className = `status-toast show ${tipo}`;

  window.clearTimeout(mostrarStatus.timer);
  mostrarStatus.timer = window.setTimeout(() => {
    status.classList.remove('show');
    status.textContent = '';
  }, 4000);
}

function redirecionarParaLogin() {
  const destino = `${window.location.pathname}${window.location.search}`;
  const query = encodeURIComponent(destino || '/');
  window.location.replace(`/auth/login?redirect=${query}`);
}

async function validarSessao() {
  const token = obterToken();
  if (!token) {
    redirecionarParaLogin();
    return null;
  }

  try {
    const response = await fetch(API.me, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (response.status === 401) {
      limparSessao();
      redirecionarParaLogin();
      return null;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro ao validar autenticação:', error);
    mostrarStatus('Não foi possível validar sua sessão.', 'error');
    return null;
  }
}

async function apiFetch(url, options = {}) {
  const token = obterToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    limparSessao();
    redirecionarParaLogin();
    throw new Error('UNAUTHORIZED');
  }

  return response;
}

function atualizarResumo(lista) {
  const total = lista.length;
  const categorias = new Set(lista.map((rest) => String(rest.category ?? '').trim()).filter(Boolean)).size;
  const ratings = lista
    .map((rest) => Number(rest.rating))
    .filter((value) => Number.isFinite(value));
  const media = ratings.length
    ? (ratings.reduce((acc, value) => acc + value, 0) / ratings.length).toFixed(1)
    : '—';

  const totalEl = document.getElementById('statTotal');
  const categoriasEl = document.getElementById('statCategories');
  const mediaEl = document.getElementById('statAverage');

  if (totalEl) totalEl.textContent = total;
  if (categoriasEl) categoriasEl.textContent = categorias;
  if (mediaEl) mediaEl.textContent = media;
}

function inicialDaCategoria(categoria) {
  const texto = String(categoria || '').trim();
  return texto ? texto[0].toUpperCase() : 'R';
}

function exibirRestaurantes(lista) {
  const container = document.getElementById('listaRestaurantes');
  if (!container) return;

  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◎</div>
        <h3>Nenhum restaurante encontrado</h3>
        <p>Cadastre um novo estabelecimento ou escolha outra categoria</p>
        <a href="#add" class="btn-secondary">Adicionar agora</a>
      </div>
    `;
    return;
  }

  lista.forEach((rest) => {
    const card = document.createElement('article');
    card.className = 'restaurant-card';

    const nome = escaparHTML(rest.name ?? 'Sem nome');
    const categoria = escaparHTML(rest.category ?? 'Sem categoria');
    const descricao = rest.description ? escaparHTML(rest.description) : '';
    const endereco = rest.address ? escaparHTML(rest.address) : '';
    const telefone = rest.phone ? escaparHTML(rest.phone) : '';
    const ratingValue = rest.rating == null ? null : Number(rest.rating);
    const rating = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : 'N/A';

    card.innerHTML = `
      <div class="restaurant-header">
        <div>
          <h3 class="restaurant-title">${nome}</h3>
          <span class="restaurant-category">${categoria}</span>
        </div>
        <div class="restaurant-rating">★ ${rating}</div>
      </div>

      ${descricao ? `<p class="restaurant-description">${descricao}</p>` : ''}

      <div class="restaurant-details">
        ${endereco ? `<div class="detail-item"><span>📍</span> ${endereco}</div>` : ''}
        ${telefone ? `<div class="detail-item"><span>📞</span> ${telefone}</div>` : ''}
      </div>

      <div class="restaurant-actions">
        <button type="button" class="btn-small" data-action="edit" data-id="${rest.id}" aria-label="Editar restaurante">
          Editar
        </button>
        <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${rest.id}" aria-label="Deletar restaurante">
          Deletar
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Adicionar event listeners para os botões de ação
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id, 10);
      deletarRestaurante(id);
    });
  });

  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id, 10);
      abrirModalEditar(id);
    });
  });
}

function atualizarFiltros(lista) {
  const select = document.getElementById('filtroCategory');
  if (!select) return;

  const valorAtual = select.value;
  const categorias = [...new Set(lista.map((rest) => rest.category).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

  select.innerHTML = '<option value="">Todas as categorias</option>';
  categorias.forEach((categoria) => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });

  if (categorias.includes(valorAtual)) select.value = valorAtual;
}

function filtrarRestaurantes() {
  const select = document.getElementById('filtroCategory');
  const categoria = select?.value || '';
  const filtrados = categoria
    ? todosRestaurantes.filter((rest) => rest.category === categoria)
    : todosRestaurantes;

  exibirRestaurantes(filtrados);
}

async function carregarRestaurantes() {
  try {
    const response = await apiFetch(API.restaurants, { cache: 'no-store' });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const dados = await response.json();
    todosRestaurantes = Array.isArray(dados)
      ? dados
      : Array.isArray(dados.restaurants)
        ? dados.restaurants
        : [];

    atualizarResumo(todosRestaurantes);
    exibirRestaurantes(todosRestaurantes);
    atualizarFiltros(todosRestaurantes);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;

    console.error('Erro ao carregar restaurantes:', error);
    document.getElementById('listaRestaurantes').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h3>Não foi possível carregar</h3>
        <p>Verifique a conexão com o servidor e tente novamente</p>
      </div>
    `;
    mostrarStatus('Erro ao conectar com o servidor da API.', 'error');
  }
}

async function cadastrarRestaurante(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = document.getElementById('submitButton');
  const novoRestaurante = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    description: document.getElementById('description').value.trim(),
    address: document.getElementById('address').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    rating: Number(document.getElementById('rating').value)
  };

  if (!novoRestaurante.name || !novoRestaurante.category) {
    mostrarStatus('Preencha nome e categoria.', 'error');
    return;
  }

  if (!Number.isFinite(novoRestaurante.rating) || novoRestaurante.rating < 0 || novoRestaurante.rating > 5) {
    mostrarStatus('A avaliação deve estar entre 0 e 5.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Cadastrando...';

  try {
    const response = await apiFetch(API.restaurants, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoRestaurante)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao cadastrar restaurante.', 'error');
      return;
    }

    form.reset();
    mostrarStatus('Restaurante cadastrado com sucesso!', 'success');
    await carregarRestaurantes();
    document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro na requisição POST:', error);
    mostrarStatus('Não foi possível conectar ao servidor.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Cadastrar Restaurante <span>→</span>';
  }
}

function abrirModalEditar(id) {
  const restaurante = todosRestaurantes.find(r => r.id === id);
  if (!restaurante) {
    mostrarStatus('Restaurante não encontrado.', 'error');
    return;
  }

  restauranteEmEdicao = restaurante;

  // Criar ou atualizar modal
  let modal = document.getElementById('editModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'edit-modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="edit-modal-content">
      <div class="edit-modal-header">
        <h2>Editar Restaurante</h2>
        <button type="button" class="edit-modal-close" aria-label="Fechar">&times;</button>
      </div>

      <form id="editForm" class="edit-modal-form">
        <div class="form-group">
          <label for="editName">Nome do Restaurante</label>
          <input 
            type="text" 
            id="editName" 
            maxlength="120"
            value="${escaparHTML(restaurante.name || '')}"
            required
          >
        </div>

        <div class="form-group">
          <label for="editCategory">Categoria</label>
          <input 
            type="text" 
            id="editCategory" 
            maxlength="80"
            value="${escaparHTML(restaurante.category || '')}"
            required
          >
        </div>

        <div class="form-group">
          <label for="editDescription">Descrição</label>
          <textarea 
            id="editDescription" 
            maxlength="300"
            rows="3"
          >${escaparHTML(restaurante.description || '')}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="editAddress">Endereço</label>
            <input 
              type="text" 
              id="editAddress" 
              maxlength="200"
              value="${escaparHTML(restaurante.address || '')}"
            >
          </div>

          <div class="form-group">
            <label for="editPhone">Telefone</label>
            <input 
              type="tel" 
              id="editPhone" 
              value="${escaparHTML(restaurante.phone || '')}"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="editRating">Avaliação</label>
          <div class="rating-input-wrapper">
            <input 
              type="number" 
              id="editRating" 
              step="0.1"
              min="0"
              max="5"
              value="${restaurante.rating || ''}"
              required
            >
            <span class="rating-unit">★ / 5</span>
          </div>
        </div>

        <div class="edit-modal-actions">
          <button type="button" class="btn-secondary" id="cancelEditButton">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" id="submitEditButton">
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('show');

  // Event listeners
  const closeBtn = modal.querySelector('.edit-modal-close');
  const cancelBtn = modal.querySelector('#cancelEditButton');
  const form = modal.querySelector('#editForm');

  closeBtn.addEventListener('click', fecharModalEditar);
  cancelBtn.addEventListener('click', fecharModalEditar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModalEditar();
  });
  form.addEventListener('submit', salvarEdicaoRestaurante);
}

function fecharModalEditar() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.classList.remove('show');
    restauranteEmEdicao = null;
  }
}

async function salvarEdicaoRestaurante(event) {
  event.preventDefault();

  if (!restauranteEmEdicao) return;

  const id = restauranteEmEdicao.id;
  const submitButton = document.getElementById('submitEditButton');

  const dadosAtualizados = {
    name: document.getElementById('editName').value.trim(),
    category: document.getElementById('editCategory').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    address: document.getElementById('editAddress').value.trim(),
    phone: document.getElementById('editPhone').value.trim(),
    rating: Number(document.getElementById('editRating').value)
  };

  if (!dadosAtualizados.name || !dadosAtualizados.category) {
    mostrarStatus('Preencha nome e categoria.', 'error');
    return;
  }

  if (!Number.isFinite(dadosAtualizados.rating) || dadosAtualizados.rating < 0 || dadosAtualizados.rating > 5) {
    mostrarStatus('A avaliação deve estar entre 0 e 5.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';

  try {
    const response = await apiFetch(`${API.restaurants}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao atualizar restaurante.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar Alterações';
      return;
    }

    mostrarStatus('Restaurante atualizado com sucesso!', 'success');
    fecharModalEditar();
    await carregarRestaurantes();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao atualizar restaurante:', error);
    mostrarStatus('Não foi possível atualizar o restaurante.', 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar Alterações';
  }
}

async function deletarRestaurante(id) {
  // Confirmação antes de deletar
  if (!confirm('Tem certeza que deseja deletar este restaurante? Esta ação não pode ser desfeita.')) {
    return;
  }

  try {
    const response = await apiFetch(`${API.restaurants}/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao deletar restaurante.', 'error');
      return;
    }

    mostrarStatus('Restaurante deletado com sucesso!', 'success');
    await carregarRestaurantes();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao deletar restaurante:', error);
    mostrarStatus('Não foi possível deletar o restaurante.', 'error');
  }
}

function configurarIdentidade(usuario) {
  const userName = document.getElementById('userName');
  if (!userName) return;

  const nome = usuario?.name || 'Usuário';
  userName.textContent = nome;
  userName.title = usuario?.email || nome;
}

async function fazerLogout() {
  limparSessao();
  window.location.replace('/auth/login');
}

function aplicarTiltCards(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = root.querySelectorAll?.('.tilt-card') || [];
  cards.forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';

    const strength = Number(card.dataset.tiltStrength || 5);

    const reset = () => {
      card.style.transform = '';
    };

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - .5) * strength;
      const rotateX = (0.5 - y) * strength;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
}

function configurarInteracoes() {
  aplicarTiltCards(document);

  const revealItems = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
}

async function iniciarHome() {
  const usuario = await validarSessao();
  if (!usuario) return;

  configurarIdentidade(usuario);
  document.getElementById('loadingScreen')?.classList.add('hidden');
  document.getElementById('appContent')?.classList.remove('hidden');
  configurarInteracoes();
  await carregarRestaurantes();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formCadastro')?.addEventListener('submit', cadastrarRestaurante);
  document.getElementById('filtroCategory')?.addEventListener('change', filtrarRestaurantes);
  document.getElementById('logoutButton')?.addEventListener('click', fazerLogout);
  iniciarHome();
});