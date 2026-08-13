# Skill: Spec-Driven Development

## Objetivo

Evitar que o agente implemente "o que parece certo" em vez do comportamento solicitado.

## Entrada

- requisito do README;
- `CONTEXT.md`;
- comportamento atual;
- bug/feature solicitado.

## Procedimento

1. Cite a regra relevante no plano.
2. Transforme a regra em Given/When/Then.
3. Identifique invariantes.
4. Identifique casos inválidos.
5. Defina o teste que falhará antes da implementação.
6. Implemente.
7. Verifique o teste e os gates.
8. Atualize documentação se o comportamento mudou.

## Saída

Uma especificação pequena e verificável.

## Anti-padrões

- implementar primeiro e racionalizar depois;
- criar testes que repetem a implementação;
- alterar contrato sem ADR;
- aceitar comportamento implícito em requisitos críticos.
