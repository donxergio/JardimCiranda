# 🌻 Jardim Ciranda — Site estático (GitHub Pages)

Site institucional do **Jardim Ciranda**, Centro de Educação Infantil inspirado na Pedagogia Waldorf (Joinville/SC).
100% estático: **HTML5 + CSS3 (variáveis nativas) + JavaScript Vanilla**. Zero backend, zero dependências, zero rastreadores.

---

## 1. Estrutura

```
/
├── index.html                    # Home — funil de conversão completo
├── pedagogia-waldorf/index.html  # Conteúdo do site antigo (mesma URL preservada)
├── politica-de-privacidade.html  # LGPD
├── sobre/index.html              # Redireciona URL antiga → /#sobre
├── contato/index.html            # Redireciona URL antiga → /#contato
├── 404.html
├── CNAME                         # jardimciranda.com.br
├── robots.txt · sitemap.xml · site.webmanifest · .nojekyll
└── assets/
    ├── css/styles.css            # Design system Waldorf + componentes
    ├── js/config.js              # ⚙️ ÚNICO arquivo a editar (WhatsApp, Web3Forms…)
    ├── js/main.js                # Menu, animações, aviso LGPD, mapa sob demanda
    ├── js/form.js                # Validação + WhatsApp + envio por e-mail (fetch)
    ├── js/video.js               # Vídeos do YouTube sob demanda (página Pedagogia)
    ├── fonts/*.woff2             # Lora + Nunito self-hosted (sem Google Fonts)
    └── img/*.webp                # 640w / 1280w + og-jardim-ciranda.jpg
```

Todos os caminhos são **relativos** → funciona em `usuario.github.io/repositorio` e em `jardimciranda.com.br`.
(Exceção: `404.html` usa caminhos absolutos, pois o GitHub o serve em qualquer profundidade de URL.)

## 2. Publicar no GitHub Pages

1. Crie o repositório e envie estes arquivos para a branch `main`.
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. Em **Custom domain** informe `jardimciranda.com.br` e marque **Enforce HTTPS**.
4. No DNS do domínio:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME www` → `<usuario>.github.io`
5. Verifique o domínio em **Settings → Pages → Verified domains** (evita sequestro de subdomínio).

Teste local: `npx http-server . -p 8080` e abra `http://localhost:8080`.

## 3. Configuração (antes de publicar)

Edite **`assets/js/config.js`**:

| Chave | O que é |
|---|---|
| `whatsappNumber` | `5547988916765` (DDI+DDD+número) |
| `emailProvider` | `'web3forms'`, `'formspree'` ou `''` (só WhatsApp) |
| `web3formsAccessKey` | Chave pública em https://web3forms.com — **também** substitua `SUA_CHAVE_WEB3FORMS_AQUI` no `index.html` (fallback sem JS) |
| `formspreeFormId` | Se usar Formspree |

No painel do Web3Forms/Formspree, **restrinja o domínio** a `jardimciranda.com.br` e ative o filtro de spam.

### ⚠️ Checklist de conteúdo
- [ ] **Depoimentos**: os 3 textos em `#familias` são **MODELOS**. Substitua por relatos reais com autorização escrita (LGPD art. 7º, I; CDC art. 37).
- [ ] **Horário de atendimento** (`index.html` seção contato **e** JSON-LD `openingHoursSpecification`).
- [ ] **Ritmo semanal** ilustrativo — confirmar com a equipe pedagógica.
- [ ] **Razão social / CNPJ** na Política de Privacidade.
- [ ] Instagram/Facebook → adicionar em `sameAs` no JSON-LD, se houver.

## 4. Segurança (OWASP) em um site estático

| Controle | Implementação |
|---|---|
| **CSP** | `<meta http-equiv="Content-Security-Policy">` em todas as páginas: `script-src 'self'` e `style-src 'self'` **sem `'unsafe-inline'`**. Não existe nenhum `<script>` ou `style=""` inline no HTML. |
| **XSS no DOM** | `form.js`/`main.js` usam apenas `textContent`/`createElement`. Nunca `innerHTML` com dados do usuário. |
| **Validação** | HTML5 (`required`, `pattern`, `maxlength`) + JS estrito (listas de valores permitidos, regex Unicode, limites). Sanitização remove caracteres de controle, bidi (anti-spoofing) e `< >`. |
| **Anti-spam** | Honeypot `botcheck` (nativo do Web3Forms) oculto por **classe CSS** (não por `style=""`, que a CSP bloquearia), tempo mínimo de preenchimento e cooldown de 60s por sessão. |
| **Links externos** | `rel="noopener noreferrer"` no HTML e reforçado por JS em qualquer link externo. |
| **Terceiros** | Nenhum CDN. Fontes self-hosted. Mapa (OpenStreetMap) e vídeos (youtube-nocookie) só carregam **após clique/consentimento**, em `iframe` com `sandbox`. Se um dia usar CDN: `integrity="sha384-…" crossorigin="anonymous"`. |
| **Clickjacking** | `frame-ancestors`/`X-Frame-Options` não funcionam via `<meta>`; `main.js` faz *frame-busting*. |
| **Referrer** | `<meta name="referrer" content="strict-origin-when-cross-origin">`. |

### Limitações do GitHub Pages (e como superar)
O GitHub Pages **não permite cabeçalhos HTTP personalizados** (HSTS com preload, `X-Frame-Options`, `Permissions-Policy`,
`X-Content-Type-Options` — este último o GitHub já envia). Para nota A+ em securityheaders.com, coloque o domínio atrás do
**Cloudflare (plano gratuito)** e crie uma *Transform Rule → Modify Response Header*:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: <copie a do index.html> ; frame-ancestors 'none'
```

## 5. LGPD
- **Nenhum cookie.** A escolha de privacidade fica no `localStorage` (não sai do dispositivo).
- Formulário com **consentimento explícito** e **minimização**: não pedimos nome, foto ou saúde da criança — só a faixa de idade.
- Nenhum dado é armazenado pelo site; WhatsApp é enviado pelo próprio usuário; e-mail passa pelo operador (Web3Forms/Formspree).

## 6. Desempenho (meta Lighthouse 98–100)
- Imagens WebP responsivas (`srcset` 640w/1280w), `width`/`height` explícitos (CLS = 0), `loading="lazy"` + `decoding="async"` fora da dobra.
- Imagem LCP do hero com `fetchpriority="high"` + `<link rel="preload">`.
- 3 fontes variáveis WOFF2 (~115 KB no total) com `font-display: swap` e preload.
- JS total ≈ 20 KB sem minificar, `defer`, sem bibliotecas. Mapa/vídeos fora do carregamento inicial.
- Minificação opcional para publicar: `npx lightningcss-cli --minify assets/css/styles.css -o assets/css/styles.css` e `npx terser assets/js/form.js -c -m -o assets/js/form.js`.

## 7. Imagens e privacidade infantil (ECA / LGPD)
**Regra: zero rostos identificáveis de crianças.** Imagens do site antigo reaproveitadas (todas sem rosto visível):
`jardim-crianca-brincando-terra` (criança de costas), `jardim-crianca-explorando-grama` (rosto voltado para baixo),
`jardim-familias-plantando` (adultos em mutirão). As demais foram geradas por IA e **recortadas** quando havia parte de rosto.

**Fotos reais da escola** (galeria `#espaco`; crianças só de costas): `caminhada-entre-arvores`, `caminho-do-jardim`,
`desenho-no-muro`, `pintura-com-terra`, `parque-de-madeira`, `canteiro-de-folhagens` (adulto ao fundo recortado),
`criancas-varrendo-deck` (recortada do peito para baixo, sem cabeças; só 640 px — origem pequena) e
`festa-das-tochas` (recorte só das tochas e do céu, sem pessoas). Substituíram a imagem de IA
`caminho-no-jardim` (removida) e saíram da galeria `horta-colheita`, `maos-amassando-pao` e `maos-tecendo-la`
(continuam no bloco "Um dia no Jardim"). `tanque-de-areia` foi **removida** (lona/saco de obra visível).
Descartadas do lote de out/2026: fotos do tanque de areia com crianças (rosto de perfil visível, crianças sem
roupa, lona de obra e baixa resolução).

Tratamento aplicado às fotos reais (para combinar com a paleta do site): recorte, dessaturação ~20 % (mais forte em
azuis e vermelhos muito vivos — ex.: lona azul, camisetas), aquecimento leve (pêssego/ocre), pretos levantados e
brancos cremosos (look matte), contraste −8 % e nitidez suave; exportação WebP 640w + 1280w (q 72/66).

- [ ] Confirmar autorização de uso de imagem da **professora** (`caminhada-entre-arvores`) e dos responsáveis pelas crianças, mesmo de costas.

> Recomenda-se substituir progressivamente as imagens geradas por fotos reais da escola seguindo as mesmas regras.

### Prompts para gerar/refazer imagens (estilo unificado)
Sufixo comum: *"soft natural light, warm pastel earthy palette (peach, ochre, sage, lavender, cream), shallow depth of field, film photography look, calm and cozy, Waldorf aesthetic. Only hands/back visible — NO faces, nobody facing the camera."*

| Arquivo | Prompt |
|---|---|
| `maos-amassando-pao` | Close-up of small child hands kneading whole-grain bread dough on a rustic wooden table dusted with flour, linen cloth, ceramic bowl. |
| `pintura-aquarela` | Overhead shot of a small child's hand with a wide brush painting wet-on-wet watercolor in yellow, rose and blue, glass jars, natural sponge. |
| `modelagem-cera` | Close-up of small child hands modeling colored beeswax into a little bird, beeswax sheets in yellow, rose and green on a wooden table. |
| `maos-tecendo-la` | Small child hands finger-knitting natural sheep wool in cream and rose, linen apron, wicker basket of yarn. |
| `horta-colheita` | Small soil-covered hands holding freshly harvested carrots and lettuce over raised wooden garden beds, metal watering can. |
| `mesa-da-epoca` | Waldorf seasonal nature table: silk cloths in peach/ochre/sage, pine cones, leaves, stones, beeswax candle, felt gnomes, faceless rag doll. No people. |
| `brinquedos-naturais` | Untreated wooden toys: branch blocks, wooden rainbow, wooden animals, play silks, basket of wool balls, Waldorf doll on a small chair. No people. |
| ~~`caminho-no-jardim`~~ | *(substituída por foto real)* Three small children seen from behind, hand in hand, walking barefoot on a grass path toward a mango tree at golden sunset, backlit silhouettes. |
| *(sugestão)* `tanque-de-areia` | *(foto real removida — refazer sem lona/obra)* Wooden sandbox with sand toys and a small wooden playhouse in a green garden, only small hands and backs visible. |
| *(sugestão)* `roda-ritmica` | Top-down view of small bare feet and joined hands forming a circle on green grass, flower petals, no heads in frame. |
| *(sugestão)* `cozinha` | Rustic school kitchen with clay pots, seasonal fruits in wicker baskets, wooden spoons, morning light. No people. |
