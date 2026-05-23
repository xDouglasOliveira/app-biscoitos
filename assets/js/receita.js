/* =====================================================
   RECEITA.JS — RENDERIZA A RECEITA DO JSON

   Lê o parâmetro ?id=XX da URL, busca a receita no
   JSON, e popula o template HTML com todos os dados.
   Também gerencia o checklist e o progresso.
   ===================================================== */

if (!window.__recipesCache) window.__recipesCache = null;

// Categorias para exibição
const CAT_NOMES = {
  classicos:   "Os Clássicos Indispensáveis",
  vendedores:  "Sabores que Vendem Muito",
  premium:     "Os Premium",
  brasileiros: "Sabores do Brasil",
  refrescantes:"Os Refrescantes",
  sazonais:    "Os Sazonais",
  especiais:   "Os Especiais",
  salgados:    "Os Salgados Premium"
};

// Nomes dos níveis
const NIVEL_NOMES = { 1:'Muito Fácil', 2:'Fácil', 3:'Intermediário', 4:'Avançado', 5:'Expert' };

// ---- INICIALIZAÇÃO ----

async function iniciarPaginaReceita() {
  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');

  if (!id) {
    window.location.href = 'receitas.html';
    return;
  }

  try {
    const dados = await carregarDadosReceita();
    const receita = dados.receitas.find(r => r.id === id && r.publicada);

    if (!receita) {
      window.location.href = 'receitas.html?erro=nao-encontrada';
      return;
    }

    // Registrar visita (para "continue de onde parou")
    Storage.setUltimaReceita(receita.id);

    // Preencher o template
    renderizarReceita(receita);

    // Restaurar estado do checklist persistido
    restaurarChecklist(receita.id, receita.ingredientes, receita.passos);

    // Inicializar botão de favoritar
    inicializarFavorito(receita.id);

    // Inicializar botão "Já fiz esta receita"
    inicializarBotaoFeita(receita.id, dados.metadata.totalReceitas);

    // Inicializar navegação prev/next
    const publicadas = dados.receitas.filter(r => r.publicada);
    inicializarNavegacao(receita, publicadas);

    // Inicializar modo cozinha (arquivo modo-cozinha.js)
    if (typeof inicializarModoCozinha === 'function') {
      inicializarModoCozinha();
    }

    // Esconder loading e mostrar conteúdo
    document.getElementById('loading').style.display = 'none';
    document.getElementById('receita-conteudo').style.display = 'block';

  } catch (erro) {
    console.error('Erro ao carregar receita:', erro);
    const loading = document.getElementById('loading');
    if (loading) loading.innerHTML = `
      <p>Não foi possível carregar a receita.</p>
      <a href="receitas.html" class="btn btn-secondary" style="margin-top:1rem">← Voltar às receitas</a>`;
  }
}

async function carregarDadosReceita() {
  if (window.__recipesCache) return window.__recipesCache;
  const resp = await fetch('data/recipes.json');
  if (!resp.ok) throw new Error('Falha ao carregar receitas');
  window.__recipesCache = await resp.json();
  return window.__recipesCache;
}

// ---- RENDERIZAÇÃO ----

function renderizarReceita(receita) {
  // Título da aba do navegador
  document.title = `${receita.nome} — Amanteigados da Rosana`;

  // Nome na barra sticky
  setText('receita-titulo-barra', receita.nome);

  // Foto hero
  const foto = document.getElementById('receita-foto');
  if (foto) {
    foto.src    = receita.foto;
    foto.alt    = receita.fotoAlt;
    foto.onerror = () => {
      foto.style.display = 'none';
      const placeholder = document.getElementById('receita-foto-placeholder');
      if (placeholder) placeholder.style.display = 'flex';
    };
  }

  // Metadados de intro
  setText('receita-nome', receita.nome);

  const catEl = document.getElementById('receita-categoria');
  if (catEl) {
    catEl.textContent = CAT_NOMES[receita.categoria] || receita.categoria;
  }

  // Tags
  const tagsEl = document.getElementById('receita-tags');
  if (tagsEl) {
    tagsEl.innerHTML = receita.tags.map(t => `<span class="tag">${t}</span>`).join('');
  }

  // Barra de metadados
  setText('meta-tempo',       formatarTempo(receita.tempoTotal));
  setHTML('meta-nivel',       `${gerarEstrelas(receita.nivel)} ${NIVEL_NOMES[receita.nivel] || ''}`);
  setText('meta-rendimento',  receita.rendimento);
  setText('meta-equip-count', `${receita.equipamentos.length} itens`);

  // História
  setText('receita-historia', receita.historia);

  // Ingredientes (checklist)
  const ingLista = document.getElementById('ingredientes-lista');
  if (ingLista) {
    ingLista.innerHTML = receita.ingredientes.map(ing => renderizarIngrediente(ing, receita.id)).join('');
    ingLista.querySelectorAll('.checklist-item').forEach(item => {
      item.addEventListener('click', () => toggleChecklistItem(item, receita.id, 'ingredientes'));
    });
  }

  // Passos (checklist)
  const passosLista = document.getElementById('passos-lista');
  if (passosLista) {
    passosLista.innerHTML = receita.passos.map(p => renderizarPasso(p, receita.id)).join('');
    passosLista.querySelectorAll('.passo-item').forEach(item => {
      item.addEventListener('click', () => toggleChecklistItem(item, receita.id, 'passos'));
    });
  }

  // Dicas
  const dicasEl = document.getElementById('dicas-lista');
  if (dicasEl) dicasEl.innerHTML = receita.dicas.map(d => `<li>${d}</li>`).join('');

  // Erros comuns
  const errosEl = document.getElementById('erros-lista');
  if (errosEl) errosEl.innerHTML = receita.errosComuns.map(e => `<li>${e}</li>`).join('');

  // Precificação
  const prec = receita.precificacao;
  setText('prec-custo',    `R$ ${prec.custoMin.toFixed(2).replace('.',',')} – R$ ${prec.custoMax.toFixed(2).replace('.',',')}`);
  setText('prec-unitaria', `R$ ${prec.vendaUnitariaMin.toFixed(2).replace('.',',')} – R$ ${prec.vendaUnitariaMax.toFixed(2).replace('.',',')}`);
  setText('prec-lata',     `R$ ${prec.vendaLataMin.toFixed(2).replace('.',',')} – R$ ${prec.vendaLataMax.toFixed(2).replace('.',',')} (lata de ${prec.unidadesPorLata})`);
  setText('prec-obs',      prec.observacao);

  // Embalagem
  setText('receita-embalagem', receita.embalagem);

  // Equipamentos
  const equipEl = document.getElementById('equip-lista');
  if (equipEl) equipEl.innerHTML = receita.equipamentos.map(eq => `<li>${eq}</li>`).join('');

  // Tempo de preparo detalhado (sub-metadados)
  if (receita.tempoPreparo) {
    const el = document.getElementById('meta-preparo');
    if (el) el.textContent = `${receita.tempoPreparo} min de preparo`;
  }
  if (receita.tempoDescanso) {
    const el = document.getElementById('meta-descanso');
    if (el) el.textContent = `${formatarTempo(receita.tempoDescanso)} de descanso`;
  }
  if (receita.tempoForno) {
    const el = document.getElementById('meta-forno');
    if (el) el.textContent = `${receita.tempoForno} min de forno`;
  }
}

// Gera HTML de um item de ingrediente
function renderizarIngrediente(ing, receitaId) {
  return `
    <li class="checklist-item" data-id="${ing.id}" data-tipo="ingredientes" role="checkbox" aria-checked="false" tabindex="0">
      <div class="checklist-checkbox" aria-hidden="true"></div>
      <div class="checklist-item-conteudo">
        <span class="checklist-item-texto">
          <span class="ing-quantidade">${ing.quantidade}</span>
          ${escapeHTML(ing.item)}
        </span>
        ${ing.obs ? `<span class="ing-obs">${escapeHTML(ing.obs)}</span>` : ''}
      </div>
    </li>`;
}

// Gera HTML de um passo
function renderizarPasso(passo, receitaId) {
  const destaque = passo.destaque ? 'destaque' : '';
  const tempoHTML = passo.tempo
    ? `<div class="passo-tempo">⏱ ${formatarTempo(passo.tempo)}</div>`
    : '';

  return `
    <li class="passo-item ${destaque}" data-id="${passo.id}" data-tipo="passos" role="checkbox" aria-checked="false" tabindex="0">
      <div class="passo-numero" aria-hidden="true">${passo.ordem}</div>
      <div class="passo-conteudo">
        <p class="passo-texto">${escapeHTML(passo.texto)}</p>
        ${tempoHTML}
      </div>
    </li>`;
}

// ---- CHECKLIST ----

// Alterna o estado marcado/desmarcado de um item
function toggleChecklistItem(item, receitaId, tipo) {
  const itemId = item.dataset.id;
  const agora  = Storage.toggleChecklistItem(receitaId, tipo, itemId);
  aplicarEstadoMarcado(item, agora);
}

// Aplica ou remove a classe 'marcado' no elemento
function aplicarEstadoMarcado(item, marcado) {
  item.classList.toggle('marcado', marcado);
  item.setAttribute('aria-checked', String(marcado));

  const checkbox = item.querySelector('.checklist-checkbox');
  if (checkbox) checkbox.textContent = marcado ? '✓' : '';

  const numero = item.querySelector('.passo-numero');
  if (numero) numero.textContent = marcado ? '✓' : item.dataset.ordem || '';
}

// Restaura o estado do checklist do localStorage quando a página carrega
function restaurarChecklist(receitaId, ingredientes, passos) {
  const checklist = Storage.getChecklist(receitaId);

  // Restaurar ingredientes marcados
  checklist.ingredientes.forEach(itemId => {
    const el = document.querySelector(`[data-id="${itemId}"][data-tipo="ingredientes"]`);
    if (el) aplicarEstadoMarcado(el, true);
  });

  // Restaurar passos marcados
  checklist.passos.forEach(itemId => {
    const el = document.querySelector(`[data-id="${itemId}"][data-tipo="passos"]`);
    if (el) {
      const numeroEl = el.querySelector('.passo-numero');
      if (numeroEl) {
        const ordemAtual = numeroEl.textContent;
        el.dataset.ordem = ordemAtual;
      }
      aplicarEstadoMarcado(el, true);
    }
  });

  // Suporte a teclado (Enter/Espaço no checklist)
  document.querySelectorAll('.checklist-item, .passo-item').forEach(item => {
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tipo = item.dataset.tipo;
        const id   = item.closest('.page-content').querySelector('[data-receita-id]')?.dataset?.receitaId || receitaId;
        toggleChecklistItem(item, id, tipo);
      }
    });
  });
}

// ---- FAVORITAR ----

function inicializarFavorito(receitaId) {
  const btn = document.getElementById('btn-favoritar');
  if (!btn) return;

  const ehFav = Storage.ehFavorito(receitaId);
  atualizarBotaoFavoritar(btn, ehFav);

  btn.addEventListener('click', () => {
    const agora = Storage.toggleFavorito(receitaId);
    atualizarBotaoFavoritar(btn, agora);
    mostrarToastLeve(agora ? 'Adicionada aos favoritos ❤️' : 'Removida dos favoritos');
  });
}

function atualizarBotaoFavoritar(btn, ehFavorita) {
  btn.textContent = ehFavorita ? '❤️' : '♡';
  btn.classList.toggle('favoritada', ehFavorita);
  btn.setAttribute('aria-pressed', String(ehFavorita));
  btn.setAttribute('aria-label', ehFavorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
}

// ---- BOTÃO "JÁ FIZ ESTA RECEITA" ----

function inicializarBotaoFeita(receitaId, totalReceitas) {
  const btn = document.getElementById('btn-feita');
  if (!btn) return;

  // Verificar se já foi marcada
  if (Storage.estaReceiraFeita(receitaId)) {
    marcarBotaoComoJaFeita(btn);
  }

  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    Storage.marcarReceitaFeita(receitaId);
    marcarBotaoComoJaFeita(btn);
    mostrarToastLeve('Receita concluída! ✓');
    // Exibe modal Okinawa uma única vez após a 1ª receita concluída
    setTimeout(() => {
      if (typeof exibirModalOkinawa === 'function') exibirModalOkinawa();
    }, 800);
  });
}

function marcarBotaoComoJaFeita(btn) {
  btn.textContent = '✓ Receita já concluída!';
  btn.classList.add('btn-ja-feita');
  btn.classList.remove('btn-success');
  btn.disabled = true;
  btn.setAttribute('aria-pressed', 'true');
}

// ---- NAVEGAÇÃO PREV/NEXT ----

function inicializarNavegacao(receitaAtual, todasPublicadas) {
  const index = todasPublicadas.findIndex(r => r.id === receitaAtual.id);

  const btnAnterior = document.getElementById('btn-anterior');
  const btnProxima  = document.getElementById('btn-proxima');
  const navRodape   = document.getElementById('nav-rodape');

  if (!btnAnterior || !btnProxima) return;

  const anterior = index > 0 ? todasPublicadas[index - 1] : null;
  const proxima  = index < todasPublicadas.length - 1 ? todasPublicadas[index + 1] : null;

  if (anterior) {
    btnAnterior.href = `receita.html?id=${anterior.id}`;
    btnAnterior.title = anterior.nome;
    btnAnterior.innerHTML = `<span class="nav-dir">←</span><span class="nav-nome">${anterior.nome}</span>`;
  } else {
    btnAnterior.style.visibility = 'hidden';
  }

  if (proxima) {
    btnProxima.href = `receita.html?id=${proxima.id}`;
    btnProxima.title = proxima.nome;
    btnProxima.innerHTML = `<span class="nav-nome">${proxima.nome}</span><span class="nav-dir">→</span>`;
  } else {
    btnProxima.style.visibility = 'hidden';
  }

  if (navRodape) navRodape.style.display = 'flex';
}

// ---- UTILITÁRIOS ----

function setText(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto || '';
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html || '';
}

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
    const cor = i <= nivel ? 'var(--accent-primary)' : 'var(--border-medium)';
    html += `<span style="color:${cor}">${i <= nivel ? '★' : '☆'}</span>`;
  }
  return html;
}

// Escapa HTML para evitar injeção de código nos textos do JSON
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function mostrarToastLeve(mensagem) {
  let toast = document.getElementById('toast-global');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-global';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2500);
}

// ---- INICIALIZAR ----

document.addEventListener('DOMContentLoaded', () => {
  if (!verificarAcesso()) return;
  iniciarPaginaReceita();
});
