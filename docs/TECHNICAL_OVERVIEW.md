# Technical Overview

## Objective
Gerar sites completos com base em prompts, com fluxo de produto e integracoes de dados.

## Core modules
- `app/`: rotas e paginas.
- `components/`: blocos de interface.
- `lib/`: integracoes e utilitarios.
- `scripts/`: seed e worker de fila.
- `tests/`: suites de validacao.

## Test and quality
- testes unitarios com Vitest
- rotina de CI para lint, test e build

## Evolution path
- reforcar testes e2e
- ampliar observabilidade de jobs
- consolidar estrategia de templates