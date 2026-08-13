# Skill: Looping Engineering

## Loop

```text
OBSERVE → SPECIFY → PLAN → IMPLEMENT → VERIFY → ATTACK → FIX → VERIFY
```

## Observe

Leia código e testes antes de editar. Mapeie dependências e fronteiras.

## Specify

Defina:

- entrada;
- saída;
- invariantes;
- erros;
- observabilidade;
- critérios de aceite.

## Plan

Faça o menor plano possível. Não refatore áreas não relacionadas.

## Implement

Mantenha funções puras no domínio e adapters nas bordas.

## Verify

Rode o menor conjunto relevante e depois a suíte completa.

## Attack

Tente invalidar a solução com dados extremos, incompletos, ambíguos e maliciosos.

## Fix

Corrija a causa raiz.

## Verify novamente

Nenhum "passou uma vez" substitui a suíte final.

## Regra para agentes

Se o agente descobrir que a premissa usada no plano estava errada, ele deve:

1. parar;
2. registrar a descoberta;
3. atualizar a spec;
4. revisar o plano;
5. só então continuar.
