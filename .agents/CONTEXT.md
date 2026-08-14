# CONTEXTO DO PROJETO — Quick Filler (Desafio Técnico)

## Hierarquia de fontes

1. `.specify/memory/constitution.md`;
2. `README.md` para contrato HTTP e requisitos externos;
3. este contexto e `.agents/AGENT.md`;
4. os artefatos derivados em `specs/001-pdf-transcription-workflow/`.

## 1. Visão Geral do Produto
O Quick Filler é uma aplicação web que transcreve documentos trabalhistas em PDF (cartões de ponto e holerites) para planilhas estruturadas (.xlsx, .csv, .json). O fluxo completo consiste em:
1. Upload do PDF (escolhendo o tipo: `cartao-ponto` ou `holerite`).
2. Processamento assíncrono (com suporte a extração de texto e OCR para PDFs digitalizados).
3. Interface de revisão (tabela editável lado a lado com o PDF original, destacando incertezas e inconsistências).
4. Exportação e download da planilha final corrigida pelo usuário.

## 2. Stack Tecnológica
- **Framework Fullstack:** Next.js (App Router) com TypeScript.
- **UI & Componentes:** Material UI Core v9 com Emotion e `Table`/`TextField`; não usar `@mui/x-data-grid`.
- **Visualizador de PDF:** visualizador cliente equivalente, usando o PDF selecionado no fluxo local.
- **Extração & OCR:** `pdfjs-dist` para texto nativo e `tesseract.js` em Node.js para páginas sem texto utilizável.
- **Exportação de Planilhas:** ExcelJS.
- **Infraestrutura:** Docker (`Dockerfile` + `docker-compose.yml`).
- **Testes Unitários & Integração:** Jest + React Testing Library (RTL).
- **Testes End-to-End (E2E):** Playwright.

## 3. Contrato da API HTTP (OBRIGATÓRIO E LITERAL)
A API deve obrigatoriamente implementar os seguintes endpoints:

- `POST /api/transcricoes` (multipart/form-data com `arquivo` e `tipo`: `"cartao-ponto"` | `"holerite"`) -> Retorna `202 Accepted` `{ "id": "string" }`.
- `GET /api/transcricoes/:id` -> Retorna `200 OK` `{ "id", "tipo", "status": "processando"|"concluido"|"erro", "erro": string|null, "value": JSON|null }`.
- `PUT /api/transcricoes/:id` -> Recebe `{ "value": { ... } }` para salvar as edições manuais feiras na interface.
- `GET /api/transcricoes/:id/planilha?formato=xlsx|csv|json` -> Baixa o arquivo de planilha gerado/atualizado.
- `GET /healthz` -> Retorna `200 OK` para verificação de disponibilidade.

O README não fixa retorno de sucesso para PUT; nenhuma diretriz deve inventá-lo.

## 4. Regras de Negócio e Estrutura de Dados

### 4.1 Incertezas e Formatação
- **NUNCA INVENTAR UM VALOR:** Se um caractere não puder ser lido com clareza, substitua por `?` (ex: `"2.3?9,77"`, `"0?:25"`).
- **NUNCA PRODUZIR DATAS IMPOSSÍVEIS:** Formatos como `38/07` ou mês `13` permanecem como texto observado, não são normalizados e são tratados como inválidos.
- **Valores Monetários:** Devem ser mantidos estritamente como `string` no formato brasileiro (ex: `"2.389,77"`).
- **Preservação de Dados:** `date_raw` e `time_raw` são imutáveis e preservam o texto observado. `?` ocupa exclusivamente um caractere que o OCR não identificou; nunca mascara um caractere lido como inválido. `time_hhmm` é editável para auditoria; campos de Holerite podem ser editados desde que preservem o contrato e a validação.

## Processamento e ambientes

- Jobs usam estado em memória do processo e processamento assíncrono sem worker separado. Reinícios eliminam jobs e resultados em memória.
- `docker compose up` é o ambiente oficial de execução e avaliação funcional, em processo único.
- Vercel é somente preview visual com fixtures seguros; não oferece OCR, armazenamento, exportação ou ciclo funcional real.

### 4.2 Cartão de Ponto
- Organizado por página (`pages[].page`) e linhas de dias (`days[]`) na ordem de aparição no PDF.
- Batidas em pares de entrada/saída (`kind`: `"IN"` | `"OUT"`).
- **Alertas calculados dinamicamente:**
  - Batidas ímpares no dia -> Alerta de Incerteza (Amarelo `#FFF3CD`).
  - Data não sequencial -> Alerta de Erro (Vermelho `#F8D7DA`).

### 4.3 Holerite
- Separação ESTRITA entre verbas principais (`fields[]` com `code`, `label`, `reference`, `value`) e a seção inferior de bases/totais (`bases[]` com `label`, `value`). `Base INSS` e `Valor Líquido` pertencem a `bases[]` e JAMAIS a `fields[]`.
- **Alertas calculados dinamicamente:**
  - Página vazia -> Alerta de Incerteza (Amarelo `#FFF3CD`).
  - Mês não sequencial -> Alerta de Erro (Vermelho `#F8D7DA`).

## 5. Regras de Estilização da Planilha (.xlsx)
- Cabeçalho: Texto em negrito, cor branca, fundo azul `#173772`.
- Destaque de linhas:
  - Fundo Amarelo `#FFF3CD`: Batidas ímpares, página vazia ou qualquer caractere `?` na linha.
  - Fundo Vermelho `#F8D7DA` + Borda esquerda `#DC3545`: Data ou mês não sequencial.
  - Se ambas as condições existirem na mesma linha, a regra **Vermelha ganha**.

## 6. Estratégia de Testes (Qualidade > Quantidade)
- O foco absoluto é validar a **corretude do pipeline, regras do negócio e o fluxo principal do usuário**.
- Poucos testes profundos e bem desenhados têm prioridade total sobre alta cobertura nominal (coverage) de componentes simples.
