# Brasa Forge

Brasa Forge gera sites completos (Next.js + Supabase) a partir de prompts em portugues.

## Requisitos

- Node.js 18+
- npm ou pnpm
- Supabase CLI (`npm install -g supabase`)
- Conta na Upstash Redis
- (Opcional) chaves de OpenAI, Anthropic e Google Gemini
- Credenciais Mercado Pago (assinaturas)

## Configuracao local

1. Copie `.env.example` para `.env.local` e preencha variaveis.
2. Inicie o Supabase local:

```bash
supabase init
supabase start
supabase db execute --file sql/001_init.sql
supabase db execute --file sql/002_indexes.sql
```

3. Instale dependencias:

```bash
npm install
```

4. Rode o app:

```bash
npm run dev
```

Acesse `http://localhost:3000` para o marketing e `/dashboard` apos autenticar via Supabase Auth.

## Scripts uteis

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Next.js em modo desenvolvimento |
| `npm run build` | Build de producao |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitarios (Vitest) |
| `npm run test:e2e` | Teste e2e da rota /api/credits/estimate |
| `npm run seed` | Popula sites de exemplo (usa `scripts/seed.ts`) |
| `npm run supabase:start` | Inicia stack Supabase local |

## Worker da fila

`scripts/worker.ts` processa jobs `generate_site` e `edit_section`:

```bash
UPSTASH_REDIS_REST_URL=... \
UPSTASH_REDIS_REST_TOKEN=... \
SUPABASE_SERVICE_ROLE_KEY=... \
NEXT_PUBLIC_SUPABASE_URL=... \
node --loader tsx scripts/worker.ts
```

## Integracoes de IA

- Configure chaves em `/dashboard/settings`.
- `lib/providers` implementa OpenAI, Anthropic e Google (Gemini).
- `/api/credits/estimate` estima creditos consumidos.

## Mercado Pago

1. Crie planos e obtenha IDs (`MERCADOPAGO_PLAN_BASIC`, `MERCADOPAGO_PLAN_PRO`).
2. Configure webhook para `/api/billing/webhook` e defina `MERCADOPAGO_WEBHOOK_SECRET`.
3. Defina `MERCADOPAGO_ACCESS_TOKEN` para chamadas REST.

## Estrutura principal

- `app/` - rotas (marketing, dashboard e API handlers)
- `components/` - UI, formularios e painel de edicao IA
- `lib/` - integracoes (Supabase, Redis, providers, fila, guards)
- `scripts/` - seed, worker e templates JSON (10 modelos)
- `sql/` - migrations base (`001_init.sql`, `002_indexes.sql`)
- `tests/` - suites unitarias e e2e com Vitest

## Templates de seed

`scripts/templates` contem 10 JSONs (`saas`, `restaurant`, `imobiliaria`, `consultoria`, `ecommerce`, `startup`, `fintech`, `educacao`, `eventos`, `portfolio`).

Execute `npm run seed` para criar usuario seed (via `SEED_USER_EMAIL/SEED_USER_PASSWORD`) e popular sites no Supabase.

## Testes

```bash
npm run test
npm run test:e2e
```

## Deploy na Vercel (resumo)

1. Suba migrations (`supabase db push`).
2. Configure variaveis no painel Vercel (`NEXT_PUBLIC_*`, `UPSTASH_*`, `MERCADOPAGO_*`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Garanta worker separado (cron ou servidor) executando `scripts/worker.ts`.
4. Configure webhook do Mercado Pago para o dominio final.

## Exportacao de sites

`/api/sites/[id]/export` gera pacote Next.js minimalista (zip) salvo no bucket `site-exports` do Supabase Storage.
