# Skill: Testing Quality

## Objetivo

Garantir que testes detectem regressões reais, especialmente falsos positivos de OCR e erros de transposição.

## Pirâmide

### Unit — muitos

Testar funções puras:

- parsing;
- normalização;
- validação;
- warnings;
- sequência;
- schemas;
- transformação para export.

### Integration — suficientes

Testar:

- processor + extractor fake;
- API + application layer;
- storage adapter;
- export service;
- upload validation.

### E2E — poucos e críticos

Testar o comportamento do usuário, não detalhes internos.

## Regra crítica: teste não pode apenas repetir a implementação

Evite:

```ts
expect(result.value).toEqual(mockInternalObject);
```

quando o mock já foi produzido pela mesma função que se quer testar.

Prefira fixtures externas e asserts sobre invariantes observáveis.

## Testes de qualidade de dados

Toda transformação que possa inventar informação deve ter testes negativos:

- `0?:25` permanece incerto;
- `38/07` não vira uma data válida;
- mês `13` não vira `12`;
- `2.3?9,77` não vira `2.399,77`;
- linha desconhecida não recebe valores inventados.

## Mutation-minded testing

Mesmo sem usar mutation testing formal, pergunte:

> Se eu remover esta condição, este teste falha?

Se a resposta for não, o teste provavelmente é fraco.

## Cobertura

Não usar um percentual global como única meta.

Prioridade:

1. invariantes de domínio;
2. contrato HTTP;
3. segurança;
4. export;
5. estados críticos de UI.

Um alvo inicial razoável para lógica crítica é ≥90%, mas não transforme cobertura em objetivo de vaidade.

## Regressão obrigatória

Todo bug encontrado deve virar teste antes ou junto da correção.

## Testes de contrato

Schemas devem validar:

- nomes;
- tipos;
- enums;
- nulabilidade;
- estrutura;
- campos obrigatórios.

## Testes de upload

Cobrir:

- PDF válido;
- extensão `.pdf` com conteúdo não-PDF;
- arquivo corrompido;
- limite exato;
- acima do limite;
- concorrência;
- arquivo vazio.

## Testes de export

Não basta verificar HTTP 200.

Verifique:

- arquivo existe;
- MIME esperado;
- cabeçalhos;
- linhas/colunas;
- valores;
- ordem;
- estilos críticos no XLSX;
- edição refletida.

## E2E

Um E2E deve comprovar uma jornada. Não transforme cada função em E2E.

## Critério de aprovação

Uma suíte é boa quando falha diante de uma implementação deliberadamente errada.
