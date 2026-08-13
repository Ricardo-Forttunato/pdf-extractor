# ADR-001 — Escolha do framework web

## Status

Accepted

## Contexto

A solução inicialmente considerava Vite + React + TypeScript.

Durante o planejamento, optamos por Next.js.

## Decisão

Utilizar Next.js como framework principal da aplicação.

Não utilizar Vite.

## Motivos

- permite manter frontend e API no mesmo projeto;
- simplifica a estrutura do repositório;
- atende naturalmente aos endpoints HTTP exigidos pelo desafio;
- reduz infraestrutura e configuração;
- mantém React + TypeScript;
- facilita o desenvolvimento dentro do prazo de aproximadamente 14 horas.

## Alternativas consideradas

### Vite + React

Vantagens:
- setup simples;
- excelente experiência para SPA;
- stack inicialmente considerada.

Desvantagens:
- exigiria definir separadamente a camada de API/backend;
- aumentaria a quantidade de decisões arquiteturais;
- não traz benefício relevante para este desafio.

### Next.js

Vantagens:
- frontend e API no mesmo projeto;
- estrutura integrada;
- React + TypeScript;
- simplifica o deploy.

Desvantagens:
- adiciona abstrações que uma SPA simples não precisaria.

## Consequência

O projeto será desenvolvido exclusivamente com Next.js.

Vite não fará parte da aplicação.

A stack de frontend fica:

Next.js + React + TypeScript + MUI.