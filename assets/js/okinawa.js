/* =====================================================
   OKINAWA.JS — Modal, FAQ, Scroll Animations,
   Sticky Bar, Diagrama 5+2, Tracking
   ===================================================== */

// ---- SCROLL ANIMATIONS (Intersection Observer) ----

function iniciarScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.dataset.delay || 0;
      setTimeout(() => el.classList.add('visivel'), Number(delay));
      observer.unobserve(el);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.ok-dor-card, .ok-entregavel-card, .ok-reveal, .ok-dia').forEach(el => {
    observer.observe(el);
  });

  // Animar cards de dor em sequência
  document.querySelectorAll('.ok-dor-card').forEach((card, i) => {
    card.dataset.delay = i * 130;
  });

  // Animar entregáveis em sequência
  document.querySelectorAll('.ok-entregavel-card').forEach((card, i) => {
    card.dataset.delay = i * 150;
  });

  // Animar dias da semana em sequência
  document.querySelectorAll('.ok-dia').forEach((dia, i) => {
    const isLivre = dia.classList.contains('livre');
    dia.dataset.delay = isLivre ? 800 + (i - 5) * 100 : i * 150;
  });

  // Animar preço quando entra na tela
  const precoDestaque = document.querySelector('.ok-preco-destaque');
  if (precoDestaque) {
    const precoObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(() => precoDestaque.classList.add('animado'), 200);
        precoObs.disconnect();
      }
    }, { threshold: 0.5 });
    precoObs.observe(precoDestaque);
  }
}

// ---- FAQ ACCORDION ----

function iniciarFAQ() {
  document.querySelectorAll('.ok-faq-pergunta').forEach(btn => {
    btn.addEventListener('click', () => {
      const item     = btn.closest('.ok-faq-item');
      const resposta = item.querySelector('.ok-faq-resposta');
      const aberto   = item.classList.contains('aberto');

      // Fecha todos
      document.querySelectorAll('.ok-faq-item.aberto').forEach(i => {
        i.classList.remove('aberto');
        i.querySelector('.ok-faq-resposta').style.maxHeight = '0';
      });

      // Abre o clicado (se estava fechado)
      if (!aberto) {
        item.classList.add('aberto');
        resposta.style.maxHeight = resposta.scrollHeight + 'px';
      }
    });
  });
}

// ---- STICKY BAR ----

function iniciarStickyBar() {
  const bar     = document.getElementById('ok-sticky-bar');
  const heroCTA = document.getElementById('ok-hero-cta');
  if (!bar || !heroCTA) return;

  const obs = new IntersectionObserver((entries) => {
    const heroVisivel = entries[0].isIntersecting;
    bar.classList.toggle('visivel', !heroVisivel);
  }, { threshold: 0 });

  obs.observe(heroCTA);
}

// ---- MODAL PÓS-RECEITA ----

const MODAL_KEY = 'ok_modal_visto';

function deveExibirModal() {
  return !localStorage.getItem(MODAL_KEY);
}

function exibirModalOkinawa() {
  if (!deveExibirModal()) return;
  const overlay = document.getElementById('ok-modal-overlay');
  if (!overlay) return;
  overlay.classList.add('visivel');
  localStorage.setItem(MODAL_KEY, '1');
}

function fecharModalOkinawa() {
  const overlay = document.getElementById('ok-modal-overlay');
  if (overlay) overlay.classList.remove('visivel');
}

// Fecha ao clicar fora do modal
document.addEventListener('click', (e) => {
  const overlay = document.getElementById('ok-modal-overlay');
  if (overlay && e.target === overlay) fecharModalOkinawa();
});

// ---- TRACKING ----

function trackPurchaseIntent(origem) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'InitiateCheckout', {
      content_name: 'Método Okinawa',
      content_category: 'CrossSell',
      value: 37.90,
      currency: 'BRL'
    });
  }
  if (typeof gtag !== 'undefined') {
    gtag('event', 'begin_checkout', {
      currency: 'BRL',
      value: 37.90,
      items: [{ item_name: 'Método Okinawa' }],
      origem: origem
    });
  }
  localStorage.setItem('ok_interesse', JSON.stringify({
    ts: Date.now(),
    origem: origem
  }));
}

// Adiciona tracking em todos os CTAs da página
function iniciarTracking() {
  document.querySelectorAll('[data-track-ok]').forEach(el => {
    el.addEventListener('click', () => {
      trackPurchaseIntent(el.dataset.trackOk || 'desconhecido');
    });
  });
}

// ---- GATE DE SENHA ----

// Hash SHA-256 da senha OKINAWA2026
const SENHA_HASH = '889cf72bb266282c15cad50f4b5a1043e6e2e968bfc51bc51adaf9b72ad05e62';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verificarSenhaOkinawa() {
  const input = document.getElementById('ok-senha-input');
  const erro  = document.getElementById('ok-senha-erro');
  if (!input) return;

  const valor = input.value.trim().toUpperCase();
  if (!valor) return;

  const hash = await sha256(valor);

  if (hash === SENHA_HASH) {
    localStorage.setItem('okinawa_acesso', '1');
    mostrarAreaAcesso();
  } else {
    input.classList.add('erro');
    erro.style.display = 'block';
    setTimeout(() => input.classList.remove('erro'), 600);
  }
}

function verificarAcessoOkinawa() {
  // Verifica se já tem acesso salvo
  if (localStorage.getItem('okinawa_acesso') === '1') {
    mostrarAreaAcesso();
    return true;
  }
  // Verifica se veio com código na URL (ex: ?codigo=OKINAWA2026)
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get('codigo');
  if (codigo && codigo.toUpperCase() === 'OKINAWA2026') {
    localStorage.setItem('okinawa_acesso', '1');
    mostrarAreaAcesso();
    return true;
  }
  return false;
}

function mostrarAreaAcesso() {
  const gate = document.getElementById('ok-gate');
  const area = document.getElementById('ok-pdf-area');
  if (gate) gate.style.display = 'none';
  if (area) area.style.display = 'block';
}

// ---- INICIALIZAÇÃO ----

document.addEventListener('DOMContentLoaded', () => {
  iniciarScrollAnimations();
  iniciarFAQ();
  iniciarStickyBar();
  iniciarTracking();

  // Enter no campo de senha
  const senhaInput = document.getElementById('ok-senha-input');
  if (senhaInput) {
    senhaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verificarSenhaOkinawa();
    });
    // Verifica acesso já salvo
    verificarAcessoOkinawa();
  }
});
