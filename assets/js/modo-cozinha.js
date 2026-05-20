/* =====================================================
   MODO-COZINHA.JS — FOCO TOTAL PARA COZINHAR

   Esconde elementos secundários, aumenta fontes,
   e ativa WakeLock (tela não apaga) quando disponível.
   ===================================================== */

let wakeLock = null;           // referência ao WakeLock ativo
let modoCozinhaAtivo = false;  // estado atual

// Inicializa o botão do modo cozinha
function inicializarModoCozinha() {
  const btn = document.getElementById('btn-modo-cozinha');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (modoCozinhaAtivo) {
      desativarModoCozinha();
    } else {
      ativarModoCozinha();
    }
  });
}

// Ativa o modo cozinha
async function ativarModoCozinha() {
  modoCozinhaAtivo = true;

  // Adiciona classe ao body que via CSS esconde/amplia os elementos
  document.body.classList.add('modo-cozinha-ativo');

  // Atualizar botão
  const btn = document.getElementById('btn-modo-cozinha');
  if (btn) {
    btn.textContent = '✕ Sair do Modo Cozinha';
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Sair do modo cozinha');
  }

  // Scroll para o topo ao entrar no modo
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Tentar ativar WakeLock (impede a tela de apagar)
  await ativarWakeLock();
}

// Desativa o modo cozinha e restaura tudo
function desativarModoCozinha() {
  modoCozinhaAtivo = false;
  document.body.classList.remove('modo-cozinha-ativo');

  const btn = document.getElementById('btn-modo-cozinha');
  if (btn) {
    btn.textContent = '👨‍🍳 Modo Cozinha';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Ativar modo cozinha');
  }

  // Liberar WakeLock
  liberarWakeLock();
}

// ---- WAKELOCK API ----
// Mantém a tela acesa enquanto a usuária está cozinhando.
// Fallback gracioso: se o browser não suportar, o app continua
// funcionando normalmente sem mensagem de erro.

async function ativarWakeLock() {
  // Verificar se a API é suportada pelo browser
  if (!('wakeLock' in navigator)) {
    // Samsung Internet, Firefox e alguns browsers antigos não suportam ainda
    // Apenas ignoramos — nenhuma mensagem de erro para a usuária
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');

    // Se a tela foi bloqueada (ex: usuária mudou de app), reativar ao voltar
    wakeLock.addEventListener('release', () => {
      // Só reativar se o modo cozinha ainda estiver ativo
      if (modoCozinhaAtivo && document.visibilityState === 'visible') {
        ativarWakeLock();
      }
    });

  } catch (erro) {
    // WakeLock pode falhar em algumas condições (ex: bateria baixa)
    // Falha silenciosa — o modo cozinha continua funcionando
    console.log('WakeLock não disponível:', erro.message);
  }
}

async function liberarWakeLock() {
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch {
      // Ignorar erros ao liberar
    }
    wakeLock = null;
  }
}

// Reativar WakeLock quando o usuário volta para a aba/app
document.addEventListener('visibilitychange', async () => {
  if (modoCozinhaAtivo && document.visibilityState === 'visible' && !wakeLock) {
    await ativarWakeLock();
  }
});
