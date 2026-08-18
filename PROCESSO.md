# PROCESSO.md — Registro de desenvolvimento

## 1. Ferramentas utilizadas

| Ferramenta | Para quê |
|---|---|
| Codex / agentes | Análise de requisitos, consolidação de decisões e documentação agentic. |
| Git | Controle de versão, inspeção de alterações e validação de diffs. |
| GitHub SpecKit | Geração e manutenção dos artefatos de especificação. |

## 1.1 Fluxo Git

- Branch: `feature/001-pdf-transcription-workflow`.
- Pull request: uma por branch curta.
- Commits relevantes: seguir Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Verificações antes do merge: `git diff --check`, typecheck, testes relevantes e E2E quando o fluxo crítico for afetado.
- Estratégia de merge: squash merge em `main`.

## 2. Decisões tomadas antes da implementação

### Hierarquia de fontes

1. `.agents/CONTEXT.md` define o contrato HTTP externo e os requisitos do desafio.
2. `.specify/memory/constitution.md` define as decisões obrigatórias de governança e qualidade.
3. `.agents/AGENT.md` orienta a conduta de desenvolvimento sem contrariar as fontes anteriores.
4. `specs/001-pdf-transcription-workflow/` contém os artefatos derivados para implementação.

### Arquitetura e execução

- Next.js App Router, TypeScript estrito e MUI Core v9 com tabelas nativas; não usar `@mui/x-data-grid`.
- Leitura de texto nativo por página com `pdfjs-dist`, renderização de imagem com canvas e OCR local via Tesseract.js como fallback.
- Jobs e resultados ficam em memória no processo, sem SQLite, worker separado, Tesseract CLI ou Poppler como dependência obrigatória do runtime principal.
- `docker compose up` é o ambiente oficial para execução e avaliação funcional.
- Vercel é somente preview visual com fixtures seguros; não executa upload, OCR, processamento ou exportação real.

### Fidelidade e contrato

- Limite de upload fixo: 10 MiB (10.485.760 bytes).
- `?` representa exclusivamente caracteres que o OCR não identificou; não mascara valores lidos como inválidos.
- `date_raw` e `time_raw` são imutáveis. `time_hhmm` e campos válidos de Holerite podem ser corrigidos.
- O `CONTEXT.md` é a única fonte de métodos, caminhos, campos e retornos HTTP. Não acrescentar status ou corpo de resposta não especificados, incluindo sucesso do PUT.

## 3. Implementação e verificações

- Estruturado o App Router, MUI Core v9, TypeScript estrito, Zod, repositório em memória e rotas
  contratuais sem extensão do HTTP público.
- Implementados extração nativa por página, renderização em memória e fallback Tesseract.js; logs
  contêm apenas o ID opaco e o evento operacional.
- Implementados parsers, validações de fidelidade, avisos derivados, revisão com PDF local e
  exportação XLSX/CSV/JSON a partir da última correção válida.
- No commit `79a9863` foi corrigido um defeito de extração/parsing nos samples `payroll-01.pdf` e
  `time-card-01.pdf`: o texto nativo estava sendo achatado com perda de estrutura, o OCR era
  acionado cedo demais e isso contaminava a entrada dos parsers com ruído e quebras de agrupamento.
- Causa raiz identificada:
  - `getTextContent()` retornava os fragmentos corretos, mas o código os unia com `join(" ")`,
    misturando colunas e removendo a noção de linha;
  - o limiar de fallback era baixo demais (`>= 3` caracteres úteis), permitindo OCR em páginas já
    legíveis por texto vetorial;
  - os parsers anteriores dependiam de linhas simples e não suportavam bem layout multi-coluna do
    holerite nem múltiplas linhas por dia no cartão.
- Correção aplicada no mesmo commit:
  - reconstrução de linhas por coordenadas `x/y` no extrator nativo;
  - aumento do limiar de texto utilizável para 50 caracteres antes de acionar Tesseract;
  - refatoração do parser de holerite para separar `fields` e `bases` em layout multi-coluna e por
    competência;
  - refatoração do parser de cartão para agrupar repetições do mesmo dia, descartar a jornada fixa
    e retornar dias sem batidas com `punches: []`.
- Na etapa seguinte, foi tentado um adapter de Vision com Gemini para tratar `payroll-02/03/04` e
  `time-card-02/03/04`, mas a abordagem não se mostrou estável como caminho principal:
  - houve bloqueios de segurança do provider em documentos trabalhistas;
  - a resposta estruturada variava demais para servir de base determinística para a tabela de revisão;
  - o retorno genérico de erro não resolvia o problema de operação nos casos 04.
- A arquitetura final foi então fechada com pipeline local e política explícita de revisão manual:
  - criação de `buildDocumentPages`, `document-pipeline`, `document-classifier`,
    `normalize-ocr-output` e `manual-review-policy`;
  - todo PDF agora é iterado página por página, sempre com texto nativo e imagem disponíveis;
  - páginas `native` usam o texto vetorial; páginas `mixed` e `scanned` usam OCR local, com
    preferência pelo texto mais rico nas páginas mistas;
  - o parser de holerite foi ampliado para múltiplos layouts reais, múltiplos demonstrativos e
    bases obrigatórias;
  - o parser de cartão foi ampliado para layouts contínuos, aglutinação do mesmo dia e normalização
    de horários compactos ou ruidosos;
  - casos de baixa confiabilidade passam a `ILEGIVEL_PARA_REVISAO_MANUAL` sem crash.
- O comportamento terminal também foi corrigido:
  - a tela de revisão abre mesmo sem extração estruturada válida;
  - foram adicionados controles para inserir manualmente páginas, dias, batidas, verbas e bases;
  - ao salvar uma revisão manual válida, o job é promovido para `concluido` e volta a ser
    exportável.
- Resultado observado nos samples locais:
  - `payroll-01`, `payroll-02` e `payroll-03`: fechamento automático;
  - `payroll-04`: revisão manual terminal;
  - `time-card-01`, `time-card-02` e `time-card-03`: fechamento automático;
  - `time-card-04`: revisão manual terminal.
- Verificação específica da solução final:
  - adicionados/ajustados testes em `tests/integration/transcricoes.contract.test.ts`,
    `tests/unit/cartao-parser.test.ts`, `tests/unit/holerite-parser.test.ts`,
    `tests/unit/document-pipeline.test.ts`, `tests/unit/document-classifier.test.ts`,
    `tests/unit/build-document-pages.test.ts` e `tests/unit/normalize-ocr-output.test.ts`;
  - validado que um job em revisão manual pode ser salvo e promovido para `concluido`.
- Validações executadas nesta etapa: `npm run typecheck` e a suíte focada de testes de pipeline,
  parsers e contrato HTTP.
- O Playwright foi configurado e o Chromium baixado. A execução não iniciou por ausência de
  `libnspr4.so`; a tentativa de `playwright install-deps chromium` exigiu senha de administrador.
- A instalação de dependências exigiu acesso ao registro npm. O relatório de dependências informa
  vulnerabilidades transitivas; nenhuma atualização automática ou quebra de versão foi aplicada.
