# Skill: Harness Engineering

## Objetivo

Fazer o repositório proteger a qualidade mesmo quando o agente comete erros.

## Guardrails obrigatórios

- TypeScript strict;
- schemas de entrada/saída;
- lint;
- typecheck;
- testes unitários/integration;
- cobertura;
- E2E;
- fixtures determinísticas;
- healthcheck;
- limites de upload;
- timeouts;
- logs redacted;
- Docker reproducível.

## Harness de desenvolvimento

Scripts:

```text
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

## Harness de CI

PR deve falhar se:

- lint falhar;
- typecheck falhar;
- teste falhar;
- contrato quebrar;
- E2E crítico falhar.

## Harness de dados

Fixtures devem incluir:

- cartão textual;
- cartão escaneado;
- cartão com `?`;
- cartão com batidas ímpares;
- cartão com data não sequencial;
- holerite textual;
- holerite escaneado;
- holerite com página vazia;
- holerite com competência não sequencial;
- holerite com `fields` e `bases` claramente separáveis.

## Princípio

Não confie em disciplina humana onde um guardrail automatizado pode impedir o erro.
