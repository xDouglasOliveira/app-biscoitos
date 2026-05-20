# Coletânea Amanteigados da Rosana — Área de Membros

Área de membros privada com 40 receitas de biscoitos amanteigados. Construída em HTML + CSS + JS puro, sem frameworks ou build tools.

---

## Rodar localmente

O projeto usa `fetch()` para carregar `data/recipes.json`, então precisa de um servidor HTTP — abrir o `index.html` direto no navegador não funciona.

**Opção 1 — VS Code Live Server**
Instale a extensão "Live Server" e clique em "Go Live" na barra inferior.

**Opção 2 — Python**
```bash
cd C:\Users\dougl\amanteigados
python -m http.server 8080
```
Acesse: `http://localhost:8080`

**Opção 3 — Node.js**
```bash
npx serve .
```

**Senha padrão:** `biscoitos2026`

---

## Deploy

O projeto é um site estático — qualquer host de arquivos estáticos funciona.

### Vercel
1. Crie uma conta em vercel.com
2. Importe o repositório ou arraste a pasta
3. Build Command: deixe vazio
4. Output Directory: `.` (raiz)
5. Clique em Deploy

### Netlify
1. Arraste a pasta inteira para app.netlify.com/drop
2. O site fica no ar imediatamente com URL aleatória
3. Para domínio próprio: configure em Domain Settings

### Cloudflare Pages
1. Conecte o repositório GitHub em pages.cloudflare.com
2. Framework preset: None
3. Build command: deixe vazio
4. Build output directory: `/`

> **Atenção:** O `robots.txt` já bloqueia todos os buscadores (`Disallow: /`). Mesmo assim, não publique a URL em redes sociais — o acesso é controlado apenas pela senha.

---

## Adicionar nova receita

1. Abra `data/recipes.json`
2. Encontre o array `"receitas"` e adicione um novo objeto seguindo o schema abaixo
3. Atualize `metadata.totalReceitas` (incremente em 1)
4. Se for uma nova categoria, adicione-a também ao array `"categorias"`

**Schema mínimo de uma receita:**
```json
{
  "id": "06",
  "slug": "nome-da-receita",
  "nome": "Nome da Receita",
  "categoria": "classicos",
  "nivel": 2,
  "tempoTotal": 60,
  "tempoPreparo": 20,
  "tempoForno": 15,
  "tempoDescanso": 0,
  "rendimento": "30 biscoitos",
  "foto": "/assets/img/receitas/nome-da-receita.jpg",
  "fotoAlt": "Descrição da foto para leitores de tela",
  "tags": ["tag1", "tag2"],
  "equipamentos": ["batedeira", "assadeira"],
  "historia": "Texto de introdução da receita...",
  "ingredientes": [
    {
      "id": "ing-06-1",
      "quantidade": "200g",
      "item": "manteiga sem sal",
      "obs": "em temperatura ambiente"
    }
  ],
  "passos": [
    {
      "id": "passo-06-1",
      "ordem": 1,
      "texto": "Descrição do passo...",
      "tempo": null,
      "destaque": false
    }
  ],
  "dicas": ["Dica 1", "Dica 2"],
  "errosComuns": ["Erro comum 1"],
  "precificacao": {
    "custoMin": 15,
    "custoMax": 20,
    "vendaUnitariaMin": 3,
    "vendaUnitariaMax": 5,
    "vendaLataMin": 45,
    "vendaLataMax": 70,
    "unidadesPorLata": 15,
    "observacao": "Observação opcional sobre precificação"
  },
  "embalagem": "Saquinho celofane com laço de fita.",
  "publicada": true,
  "destaque": false
}
```

**Campos obrigatórios:** `id`, `slug`, `nome`, `categoria`, `nivel`, `ingredientes`, `passos`, `publicada`

**IDs:** Use o número da receita como prefixo — `ing-06-1`, `ing-06-2`, `passo-06-1`, etc.

**Nível (1–5):**
- 1 = Muito fácil
- 2 = Fácil
- 3 = Médio
- 4 = Avançado
- 5 = Expert

---

## Rotacionar a senha

1. Gere o hash SHA-256 da nova senha em: **https://emn178.github.io/online-tools/sha256.html**
   - Cole a nova senha, copie o hash gerado (64 caracteres hex)

2. Abra `assets/js/auth.js` e substitua o valor da constante na linha 1:
   ```javascript
   const SENHA_HASH_ATUAL = "COLE_O_NOVO_HASH_AQUI";
   ```

3. **Nunca escreva a senha em texto puro no código.** Apenas o hash vai no arquivo.

4. Avise as alunas da nova senha — elas precisam fazer login novamente (a sessão antiga expira em até 4 horas).

---

## Atualizar o recado da Rosana

Abra `home.html` e localize o comentário `<!-- RECADO DA ROSANA -->`. Edite o texto dentro do `<p>` logo abaixo:

```html
<!-- RECADO DA ROSANA -->
<div class="card-recado">
  <p class="recado-texto">
    "Seu novo recado aqui. Troque quando quiser — fica visível para todas as alunas na tela inicial."
  </p>
  <span class="recado-assinatura">— Rosana</span>
</div>
```

---

## Atualizar o número do WhatsApp

Busque `wa.me/NUMERO` nos arquivos HTML e substitua pelo número real com DDI:

```
wa.me/5511999999999
```

Os arquivos que contêm esse placeholder:
- `index.html`
- `home.html`
- `receita.html`
- `bonus.html`
- `bonus-1.html`
- `bonus-2.html`
- `bonus-3.html`

---

## Estrutura de pastas

```
amanteigados/
├── index.html              # Tela de login (pública)
├── home.html               # Painel inicial (protegida)
├── receitas.html           # Galeria de receitas (protegida)
├── receita.html            # Receita individual (protegida)
├── bonus.html              # Lista de bônus (protegida)
├── bonus-1.html            # Guia de embalagem (protegida)
├── bonus-2.html            # Calendário de datas (protegida)
├── bonus-3.html            # Fichas de produção (protegida)
├── robots.txt              # Bloqueia indexação por buscadores
│
├── data/
│   └── recipes.json        # Fonte de dados única — todas as receitas
│
└── assets/
    ├── css/
    │   ├── variables.css   # Tokens de design (cores, espaçamentos, fontes)
    │   ├── reset.css        # Reset CSS
    │   ├── global.css       # Estilos base e componentes compartilhados
    │   ├── auth.css         # Estilos da tela de login
    │   ├── home.css         # Estilos do painel inicial
    │   ├── receitas-lista.css # Estilos da galeria de receitas
    │   ├── receita.css      # Estilos da receita individual + modo cozinha
    │   └── bonus.css        # Estilos das páginas de bônus
    │
    ├── js/
    │   ├── auth.js          # Hash SHA-256, login, logout, verificação de sessão
    │   ├── storage.js       # localStorage: favoritos, receitas feitas, checklist
    │   ├── progresso.js     # Barra de progresso na home
    │   ├── nav.js           # Menu hambúrguer e overlay mobile
    │   ├── home.js          # Destaques e "continuar de onde parei"
    │   ├── receitas-lista.js # Filtros, busca, ordenação, URL persistida
    │   ├── receita.js       # Renderização da receita, checklist, favorito
    │   └── modo-cozinha.js  # Modo cozinha: WakeLock, foco nos passos
    │
    └── img/
        └── receitas/        # Fotos das receitas (nomeadas igual ao slug)
```

---

## Adicionar fotos

As fotos das receitas devem ser salvas em `assets/img/receitas/` com o nome igual ao campo `slug` da receita:

- `shortbread-classico.jpg`
- `cafe-avela.jpg`
- etc.

**Tamanho recomendado:** 800×600px ou 4:3, JPEG com qualidade 80–85%.

O campo `foto` no JSON já aponta para esse caminho:
```json
"foto": "/assets/img/receitas/shortbread-classico.jpg"
```

Se não houver foto, o card mostra um placeholder automático — nenhum erro ocorre.

---

## Segurança

- A senha nunca fica em texto puro — apenas o hash SHA-256 em `auth.js`
- A sessão expira em **4 horas** automaticamente
- Todas as páginas internas têm um guard inline no `<head>` que redireciona antes do DOM renderizar
- `robots.txt` bloqueia todos os robôs de busca
- Todas as páginas têm `<meta name="robots" content="noindex, nofollow, noarchive">`

---

## Dependências externas

Apenas uma: **Google Fonts** (Playfair Display + Inter), carregada via CDN. O site funciona sem ela — cai para as fontes do sistema.

Nenhum framework. Nenhum pacote npm. Nenhum build step.
