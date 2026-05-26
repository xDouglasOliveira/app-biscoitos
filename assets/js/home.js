/* =====================================================
   HOME.JS — LÓGICA DO DASHBOARD

   Carrega o JSON, exibe progresso, últimas receitas
   e os 3 cards de destaque.
   ===================================================== */

// Cache global compartilhado entre scripts
if (!window.__recipesCache) {
  window.__recipesCache = null;
}

// Mapa de IDs de categoria para nome de exibição
const NOMES_CATEGORIAS = {
  classicos:   "Os Clássicos",
  vendedores:  "Sabores que Vendem",
  premium:     "Premium",
  brasileiros: "Sabores do Brasil",
  refrescantes:"Os Refrescantes",
  sazonais:    "Sazonais",
  especiais:   "Os Especiais",
  salgados:    "Os Salgados"
};

// Converte minutos em texto legível
function formatarTempo(minutos) {
  if (!minutos || minutos <= 0) return '—';
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Gera HTML de foguinhos para o nível de dificuldade da receita
function renderizarEstrelas(nivel) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span style="opacity:${i <= nivel ? '1' : '0.2'}">🔥</span>`;
  }
  return `<span class="stars" aria-label="Dificuldade: ${nivel} de 5">${html}</span>`;
}

// Busca o JSON (com cache em memória para não recarregar em navegações)
async function carregarDados() {
  if (window.__recipesCache) return window.__recipesCache;
  const resp = await fetch('data/recipes.json');
  if (!resp.ok) throw new Error('Falha ao carregar receitas');
  window.__recipesCache = await resp.json();
  return window.__recipesCache;
}

// Inicializa toda a home
async function iniciarHome() {
  try {
    const dados = await carregarDados();
    const publicadas = dados.receitas.filter(r => r.publicada);

    // "Continuar de onde parou"
    renderizarContinuar(publicadas);

    // Cards de destaque (receitas com destaque: true, embaralhadas)
    renderizarDestaques(publicadas);

  } catch (erro) {
    console.error('Erro ao carregar home:', erro);
    const erroEl = document.getElementById('erro-home');
    if (erroEl) erroEl.style.display = 'block';
  }
}

// Mostra o link "Continuar de onde parou" com a última receita visitada
function renderizarContinuar(receitas) {
  const ultimaId = Storage.getUltimaReceita();
  const container = document.getElementById('continuar-wrap');
  if (!container) return;

  if (!ultimaId) {
    // Nunca visitou uma receita — sugerir a primeira disponível
    const primeira = receitas[0];
    if (!primeira) return;
    container.innerHTML = montarContinuarHTML(primeira, 'Comece pela primeira receita');
    return;
  }

  const receita = receitas.find(r => r.id === ultimaId);
  if (!receita) return;

  container.innerHTML = montarContinuarHTML(receita, 'Continuar de onde parou');
}

function montarContinuarHTML(receita, label) {
  return `
    <a href="receita.html?id=${receita.id}" class="continuar-link">
      <div class="continuar-link-info">
        <div class="continuar-link-label">${label}</div>
        <div class="continuar-link-nome">${receita.nome}</div>
      </div>
      <span class="continuar-seta" aria-hidden="true">→</span>
    </a>
  `;
}

// Renderiza os 3 cards de destaque (receitas marcadas como destaque: true)
function renderizarDestaques(receitas) {
  const container = document.getElementById('destaques-grid');
  if (!container) return;

  let destaques = receitas.filter(r => r.destaque);

  // Se não houver suficiente com destaque, completar com as primeiras disponíveis
  if (destaques.length < 3) {
    const extras = receitas.filter(r => !r.destaque);
    destaques = [...destaques, ...extras].slice(0, 3);
  } else {
    // Embaralhar para variar (mostra destaques diferentes em cada visita)
    destaques = embaralhar(destaques).slice(0, 3);
  }

  container.innerHTML = destaques.map(r => montarRecipeCard(r)).join('');

  // Inicializar botões de favoritar nos cards
  inicializarBotoesFavoritar();
}

// Gera o HTML de um card de receita (usado em home e lista)
function montarRecipeCard(receita) {
  const ehFavorita = Storage.ehFavorito(receita.id);
  const ehFeita    = Storage.estaReceiraFeita(receita.id);
  const categoria  = NOMES_CATEGORIAS[receita.categoria] || receita.categoria;

  return `
    <a href="receita.html?id=${receita.id}" class="recipe-card" aria-label="Ver receita: ${receita.nome}">
      <div class="recipe-card-photo">
        <img src="${receita.foto}" alt="${receita.fotoAlt}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="recipe-card-photo-placeholder" style="display:none" aria-hidden="true">🍪</div>
        <div class="recipe-card-acoes">
          <button
            class="btn-favoritar-card ${ehFavorita ? 'favoritada' : ''}"
            data-id="${receita.id}"
            aria-label="${ehFavorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
            aria-pressed="${ehFavorita}"
          >${ehFavorita ? '❤️' : '♡'}</button>
          ${ehFeita ? '<div class="badge-feita-card" aria-label="Receita já feita">✓</div>' : ''}
        </div>
      </div>
      <div class="recipe-card-content">
        <div class="recipe-card-categoria">${categoria}</div>
        <h3 class="recipe-card-nome">${receita.nome}</h3>
        <div class="recipe-card-meta">
          <span>${renderizarEstrelas(receita.nivel)}</span>
          <span>⏱ ${formatarTempo(receita.tempoTotal)}</span>
        </div>
      </div>
    </a>
  `;
}

// Inicializa os botões de favoritar nos cards (sem navegar para a receita)
function inicializarBotoesFavoritar() {
  document.querySelectorAll('.btn-favoritar-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.id;
      const agora = Storage.toggleFavorito(id);

      // Atualizar visual do botão
      btn.classList.toggle('favoritada', agora);
      btn.textContent = agora ? '❤️' : '♡';
      btn.setAttribute('aria-pressed', String(agora));
      btn.setAttribute('aria-label',
        agora ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    });
  });
}

// Embaralha um array (Fisher-Yates)
function embaralhar(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  if (!verificarAcesso()) return;
  iniciarHome();
});
