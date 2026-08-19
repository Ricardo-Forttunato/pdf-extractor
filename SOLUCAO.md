# SOLUCAO.md — Decisões de solução

> Estado: implementação concluída nesta branch, com pipeline local para PDFs nativos e escaneados, revisão manual terminal para casos não confiáveis e validações automatizadas executadas com sucesso.

## Como rodar

```bash
cp .env.example .env
docker compose up --build
```

Esse é o modo oficial de avaliação funcional.

## Stack

- Next.js App Router
- TypeScript estrito
- MUI Core v9 com tabelas nativas
- `pdfjs-dist` e `@napi-rs/canvas` para texto nativo e renderização de páginas
- Tesseract.js como OCR local de fallback
- ExcelJS para exportação XLSX
- Jest e Playwright
- Docker e Docker Compose

Ficam fora do escopo: `@mui/x-data-grid`, SQLite, worker separado, Tesseract CLI e Poppler como dependência obrigatória do fluxo principal.

## Arquitetura

```text
HTTP/Interface -> application -> domain -> infrastructure
```

Uma única aplicação Next.js executa UI, rotas HTTP e processamento em memória. Parsers, regras de validação, warnings e exportadores permanecem desacoplados da interface.

## Fluxo de processamento

1. `POST /api/transcricoes` valida tipo, limite de 10 MiB e integridade do PDF.
2. O job nasce em memória com status `processando`.
3. Cada página sempre gera dois artefatos: texto nativo, quando existir, e imagem renderizada.
4. A página é classificada como `native`, `mixed` ou `scanned`.
5. O pipeline privilegia texto nativo; OCR local entra como fallback para páginas mistas ou escaneadas.
6. O texto normalizado segue para parsers específicos:
   - `holerite`: competência, verbas, bases/totais e `divergencia_calculo`
   - `cartao-ponto`: páginas, dias e `punches[]`, com aglutinação de linhas do mesmo dia
7. Uma política de confiabilidade decide entre `concluido` e `ILEGIVEL_PARA_REVISAO_MANUAL`.
8. O resultado pode ser consultado, corrigido e exportado enquanto o processo estiver ativo.

## Decisões centrais

- O sistema tenta preservar o observado; quando a leitura automática não é confiável, prefere revisão manual a inventar valores.
- `date_raw` e `time_raw` preservam a observação original; `time_hhmm` e campos válidos de holerite são corrigíveis.
- `warnings` são derivados em runtime e não persistidos no JSON final.
- A exportação usa a última versão válida salva pelo operador.
- O estado é propositalmente efêmero: reinicializar o processo elimina jobs e resultados.

## Segurança e operação

- Upload restrito a PDFs válidos de até 10 MiB.
- Nenhum CPF, nome, salário, conteúdo de PDF, OCR ou nome original de arquivo aparece em logs.
- Dados permanecem apenas na memória do processo.
- A Vercel, quando usada, serve só como preview visual; fluxo funcional completo é avaliado via Docker Compose.

## Principais correções e refatorações

- O fluxo inicial de PDFs nativos foi corrigido para não achatar `getTextContent()` em uma única linha lógica.
- O OCR deixou de ser acionado cedo demais e passou a funcionar como fallback mais estrito.
- O parsing de holerite foi ampliado para múltiplos layouts e separação consistente entre verbas e bases.
- O parsing de cartão passou a agrupar linhas do mesmo dia, ignorar colunas fixas e preservar dias sem batidas.
- Casos de baixa confiabilidade passaram a encerrar em revisão manual terminal com possibilidade de preenchimento humano e exportação posterior.

## Amostras e comportamento esperado

- `payroll-01`, `payroll-02`, `payroll-03`: fechamento automático esperado.
- `time-card-01`, `time-card-02`, `time-card-03`: fechamento automático esperado.
- `payroll-04` e `time-card-04`: tendência a revisão manual terminal por baixa confiabilidade; isso é deliberado.
- Gerado XLSX das amostras payroll-01, payroll-02, payroll-03, time-card-01, time-card-02 e time-card-03 com sucesso.
- Gerado XLSX das amostras payroll-04 e time-card-04 não foi gerado, OCR falhou ao reconhecer os caracteres dos arquivos que apresentavam ruído.

## Configuração e verificações

- `MAX_UPLOAD_BYTES`: `10_485_760`
- `JOB_RETENTION_HOURS`: `24`
- `OCR_TIMEOUT_MS`: configurável
- `MAX_CONCURRENT_OCR_JOBS`: exposto em configuração, embora o runtime atual siga serializado em fila simples

Validações executadas:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`

A cobertura automatizada valida contrato HTTP, pipeline, parsers, política de revisão manual, exportação, saúde da aplicação e smoke test E2E da tela inicial.

## Limitações conhecidas

- Estado e resultados somem em reinicializações.
- OCR local continua insuficiente para manuscritos muito ruidosos.
- A configuração de concorrência de OCR ainda não virou paralelismo real no runtime.
- A suíte E2E atual é curta e cobre só o smoke test do fluxo inicial.

## Desenvolvimento Agentic e Experimental

O projeto foi conduzido utilizando o **Codex Agent** para auxílio na implementação, refatoração, suíte de testes e documentação técnica, estruturado em dois ciclos principais de execução.

### Avaliação Comparativa dos Modelos

| Modelo / Ciclo | Principais Fortalezas | Limitações & Gargalos |
| :--- | :--- | :--- |
| **1º Ciclo: GPT-5.6 Luna** | • Excelente na construção do workflow e especificações (`spec-kit`)<br>• Alto desempenho na estruturação e consolidação de documentos e testes | • Baixa confiabilidade para OCR e parsing nativo de PDFs<br>• Maior propensão a alucinação (invenção de dados) |
| **2º Ciclo: GPT-5.4** | • Alta precisão na correção de bugs de parsing<br>• Preservação consistente de contratos HTTP em refatorações | • Menor velocidade de resposta/geração em comparação ao Luna |

### Principais Aprendizados e Trade-offs

1. **Construção vs. Parsing:** O modelo **GPT-5.6 Luna** destacou-se no setup inicial, arquitetura e documentação fluida, porém apresentou limitações com dados não estruturados (PDFs/OCR), exigindo validação humana contra dados inventados.
2. **Determinismo e Estabilidade:** O **GPT-5.4** demonstrou ser mais determinístico e confiável para refatoração de código *core* e manutenção de contratos de API, compensando a menor velocidade com saídas mais resilientes e alinhadas ao escopo.

## Retrospectiva do processo agentic

### Acertos

- Boa convergência para pipeline local determinístico.
- Preservação do contrato HTTP durante as refatorações.
- Uso de revisão manual terminal em vez de inventar dados.
- Documentação suficiente para rastrear decisões e mudanças importantes.

### Erros

- A primeira estratégia de extração de texto nativo era estruturalmente inadequada.
- O OCR inicial era permissivo demais para documentos já legíveis.
- A configuração de concorrência de OCR ficou adiantada em relação ao runtime real.
