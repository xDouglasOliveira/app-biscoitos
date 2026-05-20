/* =====================================================
   PROGRESSO.JS — CÁLCULO E EXIBIÇÃO DO PROGRESSO

   Lê receitas_feitas do localStorage e calcula
   o percentual de conclusão da coletânea.
   ===================================================== */

const Progresso = {

  // Quantas receitas foram marcadas como feitas
  contar() {
    return Storage.getReceitasFeitas().length;
  },

  // Percentual de 0 a 100
  calcularPercentual(totalReceitas) {
    if (!totalReceitas) return 0;
    return Math.min(100, Math.round((this.contar() / totalReceitas) * 100));
  },

  // Injeta a barra de progresso e os textos no elemento especificado
  renderizar(elementoId, totalReceitas) {
    const el = document.getElementById(elementoId);
    if (!el) return;

    const feitas = this.contar();
    const percentual = this.calcularPercentual(totalReceitas);

    // Atualiza texto de contagem
    const textoFeitas = el.querySelector('[data-progresso-feitas]');
    if (textoFeitas) {
      textoFeitas.textContent = feitas;
    }

    const textoTotal = el.querySelector('[data-progresso-total]');
    if (textoTotal) {
      textoTotal.textContent = totalReceitas;
    }

    const textoPercent = el.querySelector('[data-progresso-percentual]');
    if (textoPercent) {
      textoPercent.textContent = `${percentual}%`;
    }

    // Atualiza a barra visual
    const barra = el.querySelector('.progress-bar-fill');
    if (barra) {
      // Animação: começa em 0 e vai até o percentual real
      setTimeout(() => {
        barra.style.width = `${percentual}%`;
      }, 100);
    }

    // Atualiza aria attributes para acessibilidade
    const barraWrap = el.querySelector('.progress-bar-wrap');
    if (barraWrap) {
      barraWrap.setAttribute('aria-valuenow', feitas);
      barraWrap.setAttribute('aria-valuemax', totalReceitas);
    }
  },

  // Mostra uma notificação toast quando receita é marcada
  mostrarToastFeita(nomeReceita) {
    let toast = document.getElementById('toast-global');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-global';
      toast.className = 'toast sucesso';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = `✓ Receita concluída! +1 na sua jornada.`;
    toast.classList.add('visivel');

    setTimeout(() => {
      toast.classList.remove('visivel');
    }, 3000);
  }
};
