# Skill: Domain Transcription

## Modelo

O domínio deve ser agnóstico ao framework.

## Cartão

Invariantes:

- páginas 1-based;
- dias na ordem original;
- punches na ordem original;
- `IN | OUT`;
- raw separado de normalizado;
- `?` por caractere.

## Holerite

Invariantes:

- `fields` ≠ `bases`;
- dinheiro como string brasileira;
- mês 01..12;
- código e referência podem ser vazios.

## Warnings derivados

Criar funções puras:

```ts
derivePunchWarnings(days)
derivePayslipWarnings(pages)
```

## Não persistir warning

O warning depende da versão atual do dado. Persisti-lo cria risco de ficar desatualizado depois de uma edição.

## Validação

Schema de transporte e invariantes de domínio são coisas diferentes:

```text
HTTP schema → formato
Domain invariant → significado
```

Ambos devem existir.
