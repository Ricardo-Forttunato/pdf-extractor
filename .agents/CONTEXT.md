# Contexto do projeto — Quick Filler

Este arquivo é a fonte de verdade para o desenvolvimento do Quick Filler. Ele define o desafio, o produto, o contrato HTTP e os requisitos verificáveis. Os documentos em `specs/001-pdf-transcription-workflow/` são artefatos derivados e devem ser atualizados quando este contexto mudar.

## Visão do produto e escopo

O Quick Filler transcreve documentos trabalhistas em PDF — cartões de ponto e holerites — para planilhas estruturadas (`.xlsx`, `.csv` e `.json`). O produto precisa completar o ciclo único de envio, processamento, revisão e download para ambos os tipos. Os tipos compartilham o mesmo pipeline; somente a extração e o formato de planilha variam.

O fluxo é:

1. O usuário envia um PDF e seleciona `cartao-ponto` ou `holerite`.
2. A aplicação processa o documento de forma assíncrona e exibe progresso até um estado terminal.
3. O usuário revisa a transcrição em uma tabela editável ao lado do PDF original, com incertezas e inconsistências destacadas.
4. O usuário salva correções válidas e baixa a planilha atualizada.

O desafio tem horizonte de cerca de 14 horas. Se for necessário reduzir escopo, preserve o ciclo completo para os dois tipos e reduza a profundidade de extração; registre o corte e sua justificativa em `SOLUCAO.md`.

Os PDFs de referência estão em `samples/`. Parte deles é digitalizada e não possui camada de texto: a solução deve detectar esse caso e aplicar OCR.

## Stack e ambiente obrigatórios

- Next.js com App Router e TypeScript estrito.
- Material UI (MUI) Core v9 com Emotion, usando `Table` e `TextField`; `@mui/x-data-grid` não é permitido.
- `pdfjs-dist` para extração de texto nativo e `tesseract.js`, em runtime Node.js, como OCR de páginas sem texto utilizável. Não usar Tesseract CLI ou Poppler.
- ExcelJS para XLSX.
- Jest + React Testing Library para testes unitários, de componentes e integração; Playwright para E2E.
- `Dockerfile` e `docker-compose.yml`; `docker compose up` é o ambiente oficial de execução e avaliação funcional, em processo único.

Jobs são assíncronos e mantidos em memória do processo, sem worker separado. PDFs e resultados desaparecem em reinícios. Vercel é exclusivamente um preview visual com fixtures seguros: não executa OCR, processamento real, persistência, exportação ou o ciclo funcional.

Deve existir uma interface publicada e acessível para demonstração visual. A execução funcional completa é avaliada em Docker. As configurações são fornecidas por variáveis de ambiente e nenhuma credencial é versionada. O tratamento de uploads simultâneos deve ser explicitamente definido e seguro.

## Contrato HTTP obrigatório e literal

Nenhum endpoint, método, campo, status ou formato de resposta além dos listados abaixo deve ser inferido como parte do contrato.

### `POST /api/transcricoes`

Recebe `multipart/form-data` com:

- `arquivo`: o PDF;
- `tipo`: `cartao-ponto` ou `holerite`.

Retorna `202 Accepted` com `{ "id": "string" }`.

### `GET /api/transcricoes/:id`

Retorna `200 OK` com:

```json
{
  "id": "abc123",
  "tipo": "cartao-ponto",
  "status": "processando|concluido|erro",
  "erro": null,
  "value": null
}
```

Enquanto `status` for `processando`, `value` é `null`. Em `erro`, `erro` contém uma mensagem legível. Em `concluido`, `value` contém o schema correspondente ao tipo de documento.

### `PUT /api/transcricoes/:id`

Recebe `{ "value": { ... } }` com as correções feitas na interface e substitui a transcrição salva. O contexto não define status nem corpo de sucesso para esse endpoint; não os trate como parte do contrato nem invente campos de retorno.

### Downloads e saúde

- `GET /api/transcricoes/:id/planilha?formato=xlsx|csv|json` devolve a planilha com as correções aplicadas.
- `GET /healthz` retorna `200 OK` quando a aplicação está disponível.

## Modelo de saída e fidelidade dos dados

Não invente valores. Cada caractere que não possa ser lido com segurança vira `?`, individualmente. Valores legíveis mas impossíveis, como `38/07` ou mês `13`, permanecem como texto observado e não são normalizados para um valor válido.

Valores monetários são sempre strings em formato brasileiro, como `"2.389,77"`; nunca números. Campos `_raw` preservam exatamente o texto do documento. `?` representa exclusivamente um caractere não identificado, não um caractere conhecido como inválido.

### Cartão de Ponto

```json
{
  "pages": [{
    "page": 1,
    "days": [{
      "date_raw": "21/05/2019",
      "punches": [
        { "kind": "IN", "time_raw": "08:25", "time_hhmm": "08:25" },
        { "kind": "OUT", "time_raw": "18:25", "time_hhmm": "18:25" }
      ]
    }]
  }]
}
```

- `pages[].page` começa em 1.
- `days[]` e `punches[]` preservam a ordem de aparição no PDF; não ordenar por data.
- `date_raw` e `time_raw` são imutáveis e preservam o texto impresso.
- `punches[]` pode ser vazio; `kind` é `IN` ou `OUT` na sequência de origem.
- `time_hhmm` é a interpretação editável em `HH:MM` de 24 horas somente quando válida.

### Holerite

```json
{
  "pages": [{
    "page": 1,
    "year": "2020",
    "month": "01",
    "fields": [{ "code": "0010", "label": "Salário Base", "reference": "220,00", "value": "2.389,77" }],
    "bases": [{ "label": "Base INSS", "value": "2.545,68" }]
  }]
}
```

- `page` começa em 1; `year` e `month` são strings, e mês válido vai de `"01"` a `"12"`.
- `fields[]` contém somente verbas da tabela principal de vencimentos e descontos. `code` e `reference` são strings vazias quando ausentes; `label` não inclui o código.
- `bases[]` contém somente bases e totais da seção separada. `Base INSS` e `Valor Líquido` nunca pertencem a `fields[]`.

## Revisão, alertas e exportação

Alertas são derivados dos dados atuais, nunca armazenados no JSON.

- Cartão de ponto: número ímpar de batidas gera alerta amarelo; data não sequencial gera alerta vermelho.
- Holerite: página sem dados extraídos gera alerta amarelo; competência que não é o mês seguinte à última competência legível gera alerta vermelho. Dezembro para janeiro é sequencial; competência ilegível não quebra a cadeia.
- Qualquer `?` na linha também gera alerta amarelo.
- Amarelo: `#FFF3CD`. Vermelho: `#F8D7DA` com borda esquerda `#DC3545` na primeira célula. Vermelho tem precedência sobre amarelo.

A tela de revisão mostra o PDF e a tabela lado a lado. Os campos brutos do cartão são somente leitura; `time_hhmm` e os campos válidos do holerite podem ser corrigidos. Edições inválidas não são salvas, e exportações usam a última transcrição válida salva.

Todos os formatos exportam os dados corrigidos. XLSX preserva cabeçalho em negrito, branco, fundo `#173772` e os destaques. CSV e JSON não precisam representar estilos.

- Cartão: coluna `Data`, seguida de pares `Entrada n` e `Saída n` até o maior número de batidas; uma linha por dia na ordem de origem.
- Holerite: `Pág.`, `Mês`, `Ano` e uma coluna por `label` distinto de `fields`, por ordem da primeira aparição; uma linha por página e nenhuma base na união de colunas.

## Segurança, privacidade e operação

O upload exige PDF genuíno, não corrompido, sem senha, com ao menos uma página e no máximo 10 MiB (10.485.760 bytes), validado antes de armazenamento ou processamento. Falhas precisam ser legíveis sem revelar conteúdo sensível; a aplicação não solicita senhas de PDF. A política de retenção é 24 horas: após esse período, PDF e transcrição são removidos e o identificador não permite consulta, revisão ou exportação.

Não registrar nomes, CPFs, salários, horários, conteúdo do PDF, OCR, nomes de arquivo ou outros dados pessoais. Para correlação, usar apenas identificadores opacos. A aplicação é pública, sem requisito de login; configurações usam variáveis de ambiente e nenhum segredo é versionado.

## Estratégia de qualidade

Priorize poucos testes profundos sobre uma alta contagem de testes superficiais. A suíte deve cobrir parser de cartão e alertas, separação `fields`/`bases` do holerite, preservação de incerteza e valores impossíveis, transposição e estilo da planilha, contrato HTTP e um E2E do fluxo upload → processamento → revisão/correção → download.
