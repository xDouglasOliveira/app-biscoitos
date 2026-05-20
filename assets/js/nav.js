/* =====================================================
   NAV.JS — NAVEGAÇÃO COMPARTILHADA

   Inicializa o menu hambúrguer mobile, marca o link
   ativo e configura o botão de logout.
   Deve ser carregado em todas as páginas internas.
   ===================================================== */

function inicializarNav() {
  const hamburger  = document.getElementById('hamburger');
  const overlay    = document.getElementById('nav-overlay');
  const closeBtn   = document.getElementById('nav-close');

  if (!hamburger || !overlay) return;

  // Abrir menu mobile
  hamburger.addEventListener('click', () => {
    const aberto = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!aberto));
    overlay.hidden = aberto;
    // Bloquear scroll do body enquanto menu está aberto
    document.body.style.overflow = aberto ? '' : 'hidden';
  });

  // Fechar menu mobile pelo botão X
  if (closeBtn) {
    closeBtn.addEventListener('click', fecharNavOverlay);
  }

  // Fechar ao clicar em qualquer link do overlay
  overlay.querySelectorAll('.nav-overlay-link').forEach(link => {
    if (link.tagName !== 'BUTTON') {
      link.addEventListener('click', fecharNavOverlay);
    }
  });

  // Fechar com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) {
      fecharNavOverlay();
      hamburger.focus();
    }
  });

  // Marcar link ativo com base na URL atual
  marcarLinkAtivo();
}

function fecharNavOverlay() {
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('nav-overlay');
  if (!overlay) return;
  overlay.hidden = true;
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// Adiciona a classe 'ativo' ao link que corresponde à página atual
function marcarLinkAtivo() {
  const paginaAtual = window.location.pathname;

  document.querySelectorAll('.nav-link, .nav-overlay-link').forEach(link => {
    if (link.tagName !== 'A') return;
    const href = link.getAttribute('href');
    if (!href) return;

    // Verificar se o href bate com a página atual
    if (paginaAtual === href || paginaAtual.endsWith(href)) {
      link.classList.add('ativo');
      link.setAttribute('aria-current', 'page');
    }
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarNav);
