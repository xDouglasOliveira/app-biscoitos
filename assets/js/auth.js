/* =====================================================
   AUTH.JS — CONTROLE DE ACESSO E SENHA

   IMPORTANTE: A senha NUNCA aparece em texto puro aqui.
   Usamos SHA-256: só o hash é armazenado.

   Para rotacionar a senha:
   1. Acesse https://emn178.github.io/online-tools/sha256.html
   2. Digite a nova senha, copie o hash
   3. Substitua o valor de SENHA_HASH_ATUAL abaixo
   4. Atualize SENHA_VALIDA_ATE para o último dia do mês
   5. Commit + deploy + avise as alunas
   ===================================================== */

// Hash SHA-256 da senha atual.
// Senha atual: biscoitos
const SENHA_HASH_ATUAL = "cd4d07e8528d0ae07209ad939304f378782b2df30fdd8b2e63b1f3d628e21872";

// Referência humana de validade (não bloqueia o acesso após essa data,
// mas serve para o dono saber quando rotacionar).
const SENHA_VALIDA_ATE = "2026-12-31";

// Sessão expira após 4 horas sem reautenticar
const DURACAO_SESSAO_MS = 4 * 60 * 60 * 1000;

// ---- FUNÇÕES INTERNAS ----

// Gera hash SHA-256 usando a API nativa do navegador (sem libs externas)
async function gerarHash(texto) {
  const encoder = new TextEncoder();
  const dados = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dados);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- FUNÇÕES PÚBLICAS ----

// Verifica a senha digitada e redireciona se correta.
// Retorna: true (correta) ou false (incorreta)
async function verificarSenha(senhaDigitada) {
  try {
    const hash = await gerarHash(senhaDigitada.trim());

    if (hash === SENHA_HASH_ATUAL) {
      // Senha correta — salvar token de sessão e redirecionar
      const token = {
        autenticado: true,
        expira: Date.now() + DURACAO_SESSAO_MS
      };
      sessionStorage.setItem('auth_token', JSON.stringify(token));
      sessionStorage.removeItem('tentativas');
      window.location.href = 'home.html';
      return true;
    }

    // Senha incorreta — incrementar contador de tentativas
    const tentativas = getTentativas() + 1;
    sessionStorage.setItem('tentativas', tentativas);
    return false;

  } catch (erro) {
    console.error('Erro ao verificar senha:', erro);
    return false;
  }
}

// Verifica se o usuário tem acesso válido.
// Chamar no início de TODA página interna.
// Se não tiver acesso, redireciona automaticamente e retorna false.
function verificarAcesso() {
  try {
    const tokenStr = sessionStorage.getItem('auth_token');

    if (!tokenStr) {
      window.location.replace('index.html');
      return false;
    }

    const token = JSON.parse(tokenStr);

    if (!token.autenticado || Date.now() > token.expira) {
      // Sessão expirada
      sessionStorage.removeItem('auth_token');
      window.location.replace('index.html?expirou=1');
      return false;
    }

    return true;

  } catch {
    sessionStorage.removeItem('auth_token');
    window.location.replace('index.html');
    return false;
  }
}

// Faz logout: limpa sessão e volta para a tela de senha
function fazerLogout() {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('tentativas');
  window.location.href = 'index.html';
}

// Retorna quantas tentativas incorretas foram feitas nesta sessão
function getTentativas() {
  return parseInt(sessionStorage.getItem('tentativas') || '0');
}
