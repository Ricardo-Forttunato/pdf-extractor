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
- Conversão de PDF em imagem por página com `pdfjs-dist` + canvas e extração estruturada via Vision.
- Jobs e resultados ficam em memória no processo, sem SQLite, worker separado, Tesseract CLI ou Poppler.
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
- Na refatoração posterior para os documentos escaneados/manuscritos (`payroll-02/03/04`,
  `time-card-02/03/04`), o pipeline textual anterior foi substituído por um fluxo unificado de
  renderização para imagem e extração via Vision com schema estruturado.
- Ajustes centrais dessa refatoração:
  - todo PDF passou a ser iterado página por página como imagem, inclusive em arquivos multipágina;
  - holerite passou a extrair `reference`, totais e itens com `kind` (`PROVENTO`/`DESCONTO`);
  - foi adicionada validação matemática com `divergence_calculo` sem falha terminal;
  - cartões de ponto ilegíveis, especialmente manuscritos, passaram a encerrar como
    `ILEGIVEL_PARA_REVISAO_MANUAL`.
- Risco/controlador principal observado:
  - o contrato público original não previa status terminal intermediário para ilegibilidade;
  - o modelo de domínio foi expandido para suportar esse caso sem quebrar polling, store, revisão,
    exportação e validação.
- Verificação específica dessa refatoração:
  - teste unitário do adapter de Vision;
  - atualização dos testes de parser/exporter/warnings;
  - atualização do contrato de rota para status `ILEGIVEL_PARA_REVISAO_MANUAL`;
  - `npm run typecheck`, `npm test` e `npm run lint` executados com sucesso após a alteração.
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
- Verificação específica da correção:
  - adicionados/ajustados testes em `tests/integration/extraction-pipeline.test.ts`,
    `tests/unit/holerite-parser.test.ts` e `tests/unit/cartao-parser.test.ts`;
  - o conjunto completo `npm run typecheck`, `npm test` e `npm run lint` passou após a refatoração.
- Validações executadas: `npm run typecheck`, `npm test`, `npm run lint` e `npm run build`.
- A imagem foi validada por `docker compose build` e `docker compose up`; o health check retornou
  `200` em `/healthz` antes da remoção do ambiente temporário.
- O Playwright foi configurado e o Chromium baixado. A execução não iniciou por ausência de
  `libnspr4.so`; a tentativa de `playwright install-deps chromium` exigiu senha de administrador.
- A instalação de dependências exigiu acesso ao registro npm. O relatório de dependências informa
  vulnerabilidades transitivas; nenhuma atualização automática ou quebra de versão foi aplicada.
