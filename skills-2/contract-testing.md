# Skill: Contract Testing

## Contrato fechado

Endpoints:

```text
POST /api/transcricoes
GET /api/transcricoes/:id
PUT /api/transcricoes/:id
GET /api/transcricoes/:id/planilha
GET /healthz
```

## Testes obrigatórios

Para cada endpoint:

- método correto;
- payload correto;
- status correto;
- response shape correto;
- erro principal;
- headers relevantes.

## POST

Garantir 202, não 200.

## GET

Garantir:

```text
processando → value null
concluido → value presente
erro → erro presente
```

## PUT

Validar o novo `value` antes de persistir.

## Export

Validar `?formato=xlsx|csv|json`.

## Health

Deve funcionar sem depender de OCR ou processamento de PDF.

## Regra

Não criar endpoint alternativo para contornar o contrato original.
