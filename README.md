# PizzaFlow — Frontend (React + TypeScript + Tailwind + Vite)

Mobile-first. Cliente em `/loja/:slug`, painel do restaurante em `/admin`.

## Rodar
```bash
cp .env.example .env      # VITE_API_URL, VITE_DEFAULT_STORE, VITE_MP_PUBLIC_KEY
npm install
npm run dev               # http://localhost:5173
```
No backend, `Cors__Origins` deve conter `http://localhost:5173` (já vem assim no `.env.local.example`).
Com o seed do backend: loja `http://localhost:5173/loja/pizzaria-demo` · painel `http://localhost:5173/admin` (e-mail/senha do `Seed__Admin*`).

## Telas
| Cliente | Admin |
|---|---|
| Cardápio com busca fuzzy (debounce → `?search=`), categorias, detalhe com fotos/vídeo | Login JWT |
| Carrinho (observações, pedido mínimo) | **Pedidos (Kanban)**: Recebido → Preparo → Entrega/Retirada → Finalizado, cancelar com confirmação |
| Checkout: CPF validado, retirada/entrega (CEP via ViaCEP), PIX ou cartão | **Sino** em tempo real (SignalR) + som + modal com todos os dados do cliente/pedido |
| Pedido: código, QR/copia-e-cola PIX, linha do tempo (atualiza sozinha) | Produtos (CRUD, preço, estoque, upload de fotos/vídeos), Categorias, Promoções |
| Meus pedidos (CPF ou código) · chatbot flutuante | Relatórios (gráfico, KPIs, top produtos, estoque baixo) · Loja (abrir/fechar, taxas, link) |

## Pontos de atenção
- **Cartão**: o token é gerado no navegador pelo SDK do Mercado Pago (`VITE_MP_PUBLIC_KEY`, chave *pública*). Sem a chave, só PIX funciona. Parcelamento fixo em 1x.
- **Modais** usam Radix UI (`Dialog` e `AlertDialog`), inclusive todas as confirmações destrutivas.
- **Som do sino**: navegadores só tocam áudio depois do primeiro clique na página; ao logar isso já ocorre.
- **Token JWT** fica em `localStorage` (simples, mas exposto a XSS). Para endurecer, mover para cookie `HttpOnly` exige ajuste no backend.
- **Deploy** (Vercel/Netlify/Cloudflare Pages): `npm run build` → `dist/`, com *rewrite* de todas as rotas para `index.html` (SPA). Defina as `VITE_*` no painel do host e inclua a URL final em `Cors__Origins`.
- O bundle tem ~720 kB (209 kB gzip); dá para reduzir com `React.lazy` nas páginas admin.
