/* =====================================================
   RECEITAS-LISTA.JS — FILTROS, BUSCA E GRID

   Carrega todas as receitas, renderiza os cards
   e gerencia filtros por categoria, nível, tempo
   e status (favoritas, feitas).
   ===================================================== */

if (!window.__recipesCache) window.__recipesCache = null;

// Nomes de exibição para as categorias
const CATEGORIAS_NOME = {
  classicos:  "Os Clássicos",
  vendedores: "Sabores que Vendem",
  premium:    "Premium",
  sazonais:   "Sazonais",
  especiais:  "Os Especiais"
};

// Estado atual dos filtros
const filtros = {
  categoria: 'todas',
  nivel:     null,
  tempo:     null,  // '30', '60', '60+'
  status:    null,  // 'favoritas', 'feitas'
  busca:     ''
};

// Todas as receitas carregadas (cache em memória)
let todasReceitas = [];

// Timeout para debounce da busca
let debounceTimer = null;

// ---- INICIALIZAÇÃO ----

async function iniciarLista() {
  try {
    const dados = await carregarDadosLista();
    todasReceitas = dados.receitas.filter(r => r.publicada);

    // Restaurar filtros da URL (permite compartilhar e recarregar)
    lerFiltrosDaURL();

    // Renderizar filtros de categoria
    renderizarChipsCategorias(dados.categorias);

    // Renderizar grid com filtros aplicados
    renderizarGrid();

    // Inicializar eventos dos filtros
    inicializarEventosFiltros();

  } catch (erro) {
    console.error('Erro ao carregar lista:', erro);
    const grid = document.getElementById('receitas-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="receitas-vazio">
          <div class="empty-state-icon">😕</div>
          <h3>Erro ao carregar as receitas</h3>
          <p>Recarregue a página para tentar novamente.</p>
        </div>`;
    }
  }
}

async function carregarDadosLista() {
  if (window.__recipesCache) return window.__recipesCache;
  const resp = await fetch('data/recipes.json');
  if (!resp.ok) throw new Error('Falha ao buscar receitas');
  window.__recipesCache = await resp.json();
  return window.__recipesCache;
}

// ---- RENDERIZAÇÃO ----

function renderizarChipsCategorias(categorias) {
  const container = document.getElementById('chips-categorias');
  if (!container) return;

  // Chip "Todas"
  const chips = [
    `<button class="chip-categoria ${filtros.categoria === 'todas' ? 'ativo' : ''}"
             data-cat="todas" aria-pressed="${filtros.categoria === 'todas'}">
       Todas
     </button>`
  ];

  // Chips de categoria (apenas categorias que têm receitas publicadas)
  categorias.forEach(cat => {
    const temReceitas = todasReceitas.some(r => r.categoria === cat.id);
    if (!temReceitas) return;
    const ativo = filtros.categoria === cat.id;
    chips.push(`
      <button class="chip-categoria ${ativo ? 'ativo' : ''}"
              data-cat="${cat.id}" aria-pressed="${ativo}">
        ${cat.nome}
      </button>`);
  });

  container.innerHTML = chips.join('');

  // Eventos dos chips
  container.querySelectorAll('.chip-categoria').forEach(chip => {
    chip.addEventListener('click', () => {
      filtros.categoria = chip.dataset.cat;
      container.querySelectorAll('.chip-categoria').forEach(c => {
        c.classList.remove('ativo');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('ativo');
      chip.setAttribute('aria-pressed', 'true');
      renderizarGrid();
      salvarFiltrosNaURL();
    });
  });
}

function renderizarGrid() {
  const grid = document.getElementById('receitas-grid');
  const status = document.getElementById('filtros-status');
  if (!grid) return;

  const resultados = filtrar(todasReceitas);

  // Texto de status (ex: "12 receitas encontradas")
  if (status) {
    status.textContent = resultados.length === 1
      ? '1 receita encontrada'
      : `${resultados.length} receitas encontradas`;
  }

  if (resultados.length === 0) {
    grid.innerHTML = `
      <div class="receitas-vazio">
        <div class="empty-state-icon" aria-hidden="true">🔍</div>
        <h3>Nenhuma receita encontrada</h3>
        <p>Tente outros filtros ou limpe a busca.</p>
        <button class="btn btn-secondary" onclick="limparTodosFiltros()">
          Limpar filtros
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = resultados.map(r => montarCardReceita(r)).join('');

  // Inicializar botões de favoritar (sem navegar)
  grid.querySelectorAll('.btn-favoritar-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const agora = Storage.toggleFavorito(id);
      btn.classList.toggle('favoritada', agora);
      btn.textContent = agora ? '❤️' : '♡';
      btn.setAttribute('aria-pressed', String(agora));
      btn.setAttribute('aria-label', agora ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      // Se filtro "favoritas" está ativo, re-renderizar
      if (filtros.status === 'favoritas') renderizarGrid();
    });
  });
}

// Gera o HTML de um card de receita
function montarCardReceita(receita) {
  const ehFavorita = Storage.ehFavorito(receita.id);
  const ehFeita    = Storage.estaReceiraFeita(receita.id);
  const categoria  = CATEGORIAS_NOME[receita.categoria] || receita.categoria;
  const tempo      = formatarTempo(receita.tempoTotal);
  const estrelas   = gerarEstrelas(receita.nivel);

  return `
    <a href="receita.html?id=${receita.id}" class="recipe-card"
       aria-label="Ver receita: ${receita.nome}">
      <div class="recipe-card-photo">
        <img src="${receita.foto}" alt="${receita.fotoAlt}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="recipe-card-photo-placeholder" style="display:none" aria-hidden="true">🍪</div>
        <div class="recipe-card-acoes">
          <button class="btn-favoritar-card ${ehFavorita ? 'favoritada' : ''}"
                  data-id="${receita.id}"
                  aria-label="${ehFavorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                  aria-pressed="${ehFavorita}">
            ${ehFavorita ? '❤️' : '♡'}
          </button>
          ${ehFeita ? '<div class="badge-feita-card" title="Já feita">✓</div>' : ''}
        </div>
      </div>
      <div class="recipe-card-content">
        <div class="recipe-card-categoria">${categoria}</div>
        <h2 class="recipe-card-nome">${receita.nome}</h2>
        <div class="recipe-card-meta">
          <span aria-label="Nível ${receita.nivel} de 5">${estrelas}</span>
          <span aria-label="Tempo total: ${tempo}">⏱ ${tempo}</span>
        </div>
      </div>
    </a>`;
}

// ---- FILTRAGEM ----

function filtrar(receitas) {
  return receitas.filter(r => {
    // Filtro de categoria
    if (filtros.categoria !== 'todas' && r.categoria !== filtros.categoria) return false;

    // Filtro de nível
    if (filtros.nivel && r.nivel !== filtros.nivel) return false;

    // Filtro de tempo
    if (filtros.tempo) {
      if (filtros.tempo === '30' && r.tempoTotal > 30) return false;
      if (filtros.tempo === '60' && (r.tempoTotal <= 30 || r.tempoTotal > 60)) return false;
      if (filtros.tempo === '60+' && r.tempoTotal <= 60) return false;
    }

    // Filtro de status
    if (filtros.status === 'favoritas' && !Storage.ehFavorito(r.id)) return false;
    if (filtros.status === 'feitas' && !Storage.estaReceiraFeita(r.id)) return false;

    // Busca textual (nome OU ingredientes)
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase();
      const noNome = r.nome.toLowerCase().includes(q);
      const noIngrediente = r.ingredientes.some(i => i.item.toLowerCase().includes(q));
      if (!noNome && !noIngrediente) return false;
    }

    return true;
  });
}

// ---- EVENTOS ----

function inicializarEventosFiltros() {
  // Busca com debounce de 300ms
  const inputBusca = document.getElementById('input-busca');
  if (inputBusca) {
    inputBusca.value = filtros.busca;
    inputBusca.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filtros.busca = inputBusca.value.trim();
        renderizarGrid();
        salvarFiltrosNaURL();
      }, 300);
    });
  }

  // Toggle dos filtros secundários
  const toggleSecundarios = document.getElementById('toggle-filtros-sec');
  const painelSecundarios = document.getElementById('filtros-secundarios');
  if (toggleSecundarios && painelSecundarios) {
    toggleSecundarios.addEventListener('click', () => {
      const aberto = toggleSecundarios.getAttribute('aria-expanded') === 'true';
      toggleSecundarios.setAttribute('aria-expanded', String(!aberto));
      painelSecundarios.hidden = aberto;
    });
  }

  // Chips de nível
  document.querySelectorAll('.chip-nivel').forEach(chip => {
    const val = parseInt(chip.dataset.nivel);
    chip.classList.toggle('ativo', filtros.nivel === val);
    chip.setAttribute('aria-pressed', String(filtros.nivel === val));
    chip.addEventListener('click', () => {
      filtros.nivel = filtros.nivel === val ? null : val;
      document.querySelectorAll('.chip-nivel').forEach(c => {
        const cv = parseInt(c.dataset.nivel);
        c.classList.toggle('ativo', filtros.nivel === cv);
        c.setAttribute('aria-pressed', String(filtros.nivel === cv));
      });
      renderizarGrid();
      salvarFiltrosNaURL();
    });
  });

  // Chips de tempo
  document.querySelectorAll('.chip-tempo').forEach(chip => {
    chip.classList.toggle('ativo', filtros.tempo === chip.dataset.tempo);
    chip.setAttribute('aria-pressed', String(filtros.tempo === chip.dataset.tempo));
    chip.addEventListener('click', () => {
      filtros.tempo = filtros.tempo === chip.dataset.tempo ? null : chip.dataset.tempo;
      document.querySelectorAll('.chip-tempo').forEach(c => {
        c.classList.toggle('ativo', filtros.tempo === c.dataset.tempo);
        c.setAttribute('aria-pressed', String(filtros.tempo === c.dataset.tempo));
      });
      renderizarGrid();
      salvarFiltrosNaURL();
    });
  });

  // Chips de status
  document.querySelectorAll('.chip-status').forEach(chip => {
    chip.classList.toggle('ativo', filtros.status === chip.dataset.status);
    chip.setAttribute('aria-pressed', String(filtros.status === chip.dataset.status));
    chip.addEventListener('click', () => {
      filtros.status = filtros.status === chip.dataset.status ? null : chip.dataset.status;
      document.querySelectorAll('.chip-status').forEach(c => {
        c.classList.toggle('ativo', filtros.status === c.dataset.status);
        c.setAttribute('aria-pressed', String(filtros.status === c.dataset.status));
      });
      renderizarGrid();
      salvarFiltrosNaURL();
    });
  });
}

// ---- PERSISTÊNCIA DE FILTROS NA URL ----

function lerFiltrosDaURL() {
  const params = new URLSearchParams(window.location.search);
  filtros.categoria = params.get('categoria') || 'todas';
  filtros.nivel     = params.get('nivel') ? parseInt(params.get('nivel')) : null;
  filtros.tempo     = params.get('tempo') || null;
  filtros.status    = params.get('status') || null;
  filtros.busca     = params.get('q') || '';
}

function salvarFiltrosNaURL() {
  const params = new URLSearchParams();
  if (filtros.categoria !== 'todas') params.set('categoria', filtros.categoria);
  if (filtros.nivel)   params.set('nivel', filtros.nivel);
  if (filtros.tempo)   params.set('tempo', filtros.tempo);
  if (filtros.status)  params.set('status', filtros.status);
  if (filtros.busca)   params.set('q', filtros.busca);

  const novaURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  history.replaceState(null, '', novaURL);
}

// Limpa todos os filtros e volta ao estado inicial
function limparTodosFiltros() {
  filtros.categoria = 'todas';
  filtros.nivel     = null;
  filtros.tempo     = null;
  filtros.status    = null;
  filtros.busca     = '';

  const inputBusca = document.getElementById('input-busca');
  if (inputBusca) inputBusca.value = '';

  document.querySelectorAll('.chip-categoria, .chip-nivel, .chip-tempo, .chip-status').forEach(c => {
    c.classList.remove('ativo');
    c.setAttribute('aria-pressed', 'false');
  });

  const chipTodas = document.querySelector('[data-cat="todas"]');
  if (chipTodas) {
    chipTodas.classList.add('ativo');
    chipTodas.setAttribute('aria-pressed', 'true');
  }

  renderizarGrid();
  salvarFiltrosNaURL();
}

// ---- UTILITÁRIOS ----

function formatarTempo(minutos) {
  if (!minutos) return '—';
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function gerarEstrelas(nivel) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span style="color:${i <= nivel ? 'var(--accent-primary)' : 'var(--border-medium)'}">${i <= nivel ? '★' : '☆'}</span>`;
  }
  return html;
}

// ---- INICIALIZAR ----

document.addEventListener('DOMContentLoaded', () => {
  if (!verificarAcesso()) return;
  iniciarLista();
});
