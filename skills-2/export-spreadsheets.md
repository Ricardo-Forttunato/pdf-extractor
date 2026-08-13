# Skill: Spreadsheet Export

## Estratégia

Criar uma camada de exportação:

```text
Transcription
 ↓
ExportModel
 ├── xlsx
 ├── csv
 └── json
```

## Cartão

Número de pares definido pelo máximo de punches do documento.

Ordem:

```text
Data, Entrada 1, Saída 1, Entrada 2, Saída 2, ...
```

## Holerite

Construir união ordenada dos labels por primeira aparição.

Não ordenar alfabeticamente.

Uma linha por página.

## Estilos XLSX

Cabeçalho:

- fundo `#173772`;
- texto branco;
- negrito.

Warnings:

- amarelo `#FFF3CD`;
- vermelho `#F8D7DA`;
- borda esquerda `#DC3545`;
- vermelho vence.

## Testes

Testar:

- ordem;
- transposição;
- vazios;
- `?`;
- warnings;
- estilo;
- conteúdo corrigido.

CSV/JSON devem preservar informação, mesmo que estilos não existam.
