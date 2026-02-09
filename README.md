# BrasaForge

## Visao Geral
Gerador de sites com Next.js e Supabase a partir de prompts em portugues.

## Status do Projeto
| Item | Valor |
|:--|:--|
| Maturidade | Em evolucao ativa |
| Tipo | SaaS web |
| Ultima atualizacao relevante | 2026-02 |

## Stack
| Camada | Tecnologias |
|:--|:--|
| Frontend/Backend | Next.js + TypeScript |
| Dados | Supabase |
| Testes | Vitest |
| Utilitarios | scripts de seed e worker |

## Estrutura
- `app/`, `components/`, `lib/`: aplicacao principal.
- `sql/`: estrutura e migracoes.
- `scripts/`: seed/worker e suporte.
- `tests/`: testes automatizados.
- `docs/`: documentacao tecnica.

## Como Executar
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Testes
```bash
npm test
npm run test:e2e
```

## CI
Workflow padronizado em `.github/workflows/ci.yml`.

## Deploy
Recomendado via Vercel/Supabase.
Publicar URL somente apos checklist de estabilidade.

## Roadmap
- aumentar cobertura e2e
- consolidar observabilidade
- refinar templates de geracao

## Licenca
MIT (`LICENSE`).