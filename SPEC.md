# SPEC.md — Especificação Executável do Quick Filler

Este documento transforma o README em critérios verificáveis para desenvolvimento agentic.

## S-001 — Upload

**Given** um PDF válido e um tipo válido  
**When** `POST /api/transcricoes` é chamado  
**Then** responde 202 e retorna um `id`.

**Must reject:**
- campo `arquivo` ausente;
- campo `tipo` inválido;
- arquivo que não seja PDF;
- arquivo acima do limite configurado.

## S-002 — Processamento assíncrono

**Given** uma transcrição recém-criada  
**Then** seu status inicial observável é `processando`.

**When** processamento termina  
**Then** status vira `concluido` e `value` contém o contrato correto.

**When** processamento falha  
**Then** status vira `erro`, `value` é `null` e `erro` é legível.

## S-003 — Cartão de ponto

Invariantes:

- `page >= 1`;
- `days` preserva ordem do documento;
- `date_raw` é string exatamente como extraída;
- `punches` preserva ordem;
- `kind ∈ {IN, OUT}`;
- `time_raw` preserva a leitura;
- `time_hhmm` é normalizado somente quando possível;
- incerteza é representada por `?`;
- data impossível não é emitida como data válida.

## S-004 — Holerite

Invariantes:

- `page >= 1`;
- `year` é string;
- `month ∈ 01..12` quando legível;
- `fields` exclui bases/totais;
- `bases` contém somente bases/totais;
- `code`, `reference` podem ser strings vazias;
- `value` é string com o valor da moeda brasileira sem cifrões (R$) como exemplo: `"1.234,56"`;
- `?` é preservado.

## S-005 — Warnings

Warnings devem ser funções puras sobre o modelo:

```text
deriveCartaoWarnings(value)
deriveHoleriteWarnings(value)
```

Não adicionar `warning` ao JSON persistido.

## S-006 — Revisão

A UI deve:

- renderizar todas as colunas relevantes;
- permitir editar células;
- preservar o restante do documento;
- salvar pelo PUT;
- recalcular warnings depois da edição;
- impedir valores estruturalmente inválidos.

## S-007 — Export

O export deve usar o estado atual salvo.

### XLSX

Cartão:

```text
Data | Entrada 1 | Saída 1 | Entrada 2 | Saída 2 | ...
```

Holerite:

```text
Pág. | Mês | Ano | <verba 1> | <verba 2> | ...
```

Cabeçalho branco em fundo `#173772`.

Linhas com warning seguem a regra de cores do README.

## S-008 — Segurança

- upload com limite;
- PDF validado;
- erros sem PII;
- temporários limpos;
- retenção documentada;
- processamento simultâneo controlado.

## S-009 — Health

`GET /healthz` deve responder 200 quando o serviço estiver operacional.

## S-010 — E2E mínimo

O teste E2E principal deve comprovar:

1. usuário seleciona PDF;
2. escolhe tipo;
3. envia;
4. observa processamento;
5. abre revisão;
6. edita uma célula;
7. salva;
8. baixa XLSX/CSV/JSON;
9. verifica que a alteração está refletida no export.

## S-011 — Regressão de incerteza

Dado OCR produzindo `0?:25`:

- não converter para `00:25`;
- não converter para vazio;
- não rejeitar a linha inteira;
- manter `?`.

## S-012 — Regressão de separação do holerite

`Base INSS` e `Valor Líquido` não podem aparecer em `fields`.

## S-013 — Regra de sequência

Cartão:

- comparar datas legíveis adjacentes;
- data não sequencial gera warning.

Holerite:

- comparar competências legíveis;
- dezembro → janeiro é consecutivo;
- página cuja competência não foi lida não quebra a cadeia;
- comparar as próximas competências legíveis.

## Critérios de aceitação por camada

### Domínio
100% dos invariantes críticos cobertos por testes.

### API
Cada endpoint coberto por happy path + erro principal + contrato.

### UI
Estados: loading, processing, success, error, empty, invalid.

### E2E
Fluxo crítico coberto com fixture determinística.

### Export
Cada formato implementado possui pelo menos um teste de estrutura e um teste de conteúdo.

## Regra de ouro

Qualquer implementação que produza um valor plausível, porém não sustentado pelo documento, é considerada falha mesmo que o teste visual pareça correto.
