/* =====================================================
   STORAGE.JS — WRAPPER DE LOCALSTORAGE

   Centraliza toda leitura/escrita no localStorage.
   Chaves usadas no app:

   receitas_feitas        → array de IDs: ["01","03"]
   favoritos_receitas     → array de IDs: ["02"]
   ultima_receita         → string com ID: "01"
   checklist_receita_XX   → objeto por receita:
                            { ingredientes: [...], passos: [...] }
   ===================================================== */

const Storage = {

  // Lê um valor do localStorage. Retorna defaultValue se não existir.
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      // JSON inválido ou modo privado — retorna o padrão
      return defaultValue;
    }
  },

  // Salva um valor no localStorage.
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage cheio ou bloqueado (modo privado de alguns browsers)
      // Falha silenciosa — o app continua funcionando sem persistência
    }
  },

  // Remove uma chave do localStorage.
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  // ---- Receitas feitas ----

  getReceitasFeitas() {
    return this.get('receitas_feitas', []);
  },

  marcarReceitaFeita(id) {
    const feitas = this.getReceitasFeitas();
    if (!feitas.includes(id)) {
      feitas.push(id);
      this.set('receitas_feitas', feitas);
    }
  },

  estaReceiraFeita(id) {
    return this.getReceitasFeitas().includes(id);
  },

  // ---- Favoritos ----

  getFavoritos() {
    return this.get('favoritos_receitas', []);
  },

  toggleFavorito(id) {
    const favoritos = this.getFavoritos();
    const index = favoritos.indexOf(id);
    if (index > -1) {
      favoritos.splice(index, 1);
    } else {
      favoritos.push(id);
    }
    this.set('favoritos_receitas', favoritos);
    return favoritos.includes(id); // retorna true se agora é favorito
  },

  ehFavorito(id) {
    return this.getFavoritos().includes(id);
  },

  // ---- Última receita visitada ----

  setUltimaReceita(id) {
    this.set('ultima_receita', id);
  },

  getUltimaReceita() {
    return this.get('ultima_receita', null);
  },

  // ---- Checklist de ingredientes e passos ----

  getChecklist(receitaId) {
    return this.get(`checklist_receita_${receitaId}`, {
      ingredientes: [],
      passos: []
    });
  },

  toggleChecklistItem(receitaId, tipo, itemId) {
    const checklist = this.getChecklist(receitaId);
    const lista = checklist[tipo] || [];
    const index = lista.indexOf(itemId);

    if (index > -1) {
      lista.splice(index, 1);
    } else {
      lista.push(itemId);
    }

    checklist[tipo] = lista;
    this.set(`checklist_receita_${receitaId}`, checklist);
    return lista.includes(itemId); // retorna true se agora está marcado
  },

  isChecklistItemMarcado(receitaId, tipo, itemId) {
    const checklist = this.getChecklist(receitaId);
    return (checklist[tipo] || []).includes(itemId);
  },

  limparChecklist(receitaId) {
    this.remove(`checklist_receita_${receitaId}`);
  }
};
