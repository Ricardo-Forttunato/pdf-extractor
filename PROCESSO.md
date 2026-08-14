# PROCESSO.md — Registro de desenvolvimento

## 1. Ferramentas utilizadas

| Ferramenta | Para quê |
|---|---|
| Codex / agentes | Análise de requisitos, consolidação de decisões e documentação agentic. |
| Git | Controle de versão, inspeção de alterações e validação de diffs. |
| GitHub SpecKit | Geração e manutenção dos artefatos de especificação. |

## 1.1 Fluxo Git

- Branch: a definir no início da implementação.
- Pull request: uma por branch curta.
- Commits relevantes: seguir Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Verificações antes do merge: `git diff --check`, typecheck, testes relevantes e E2E quando o fluxo crítico for afetado.
- Estratégia de merge: squash merge em `main`.

## 2. Decisões tomadas antes da implementação

### Hierarquia de fontes

1. `.specify/memory/constitution.md` prevalece como fonte de decisões obrigatórias.
2. `README.md` define o contrato HTTP externo e os requisitos do desafio.
3. `.agents/AGENT.md` e `.agents/CONTEXT.md` orientam o desenvolvimento agentic sem contrariar as fontes anteriores.
4. `specs/001-pdf-transcription-workflow/` contém os artefatos derivados para implementação.

### Arquitetura e execução

- Next.js App Router, TypeScript estrito e MUI Core v9 com tabelas nativas; não usar `@mui/x-data-grid`.
- OCR em Node.js com `pdfjs-dist` para texto nativo e `tesseract.js` como fallback.
- Jobs e resultados ficam em memória no processo, sem SQLite, worker separado, Tesseract CLI ou Poppler.
- `docker compose up` é o ambiente oficial para execução e avaliação funcional.
- Vercel é somente preview visual com fixtures seguros; não executa upload, OCR, processamento ou exportação real.

### Fidelidade e contrato

- Limite de upload fixo: 10 MiB (10.485.760 bytes).
- `?` representa exclusivamente caracteres que o OCR não identificou; não mascara valores lidos como inválidos.
- `date_raw` e `time_raw` são imutáveis. `time_hhmm` e campos válidos de Holerite podem ser corrigidos.
- O README é a única fonte de métodos, caminhos, campos e retornos HTTP. Não acrescentar status ou corpo de resposta não especificados, incluindo sucesso do PUT.

## 3. Estado atual

Esta etapa consolidou regras e artefatos de planejamento. A implementação da aplicação, os testes e o deploy funcional ainda não foram iniciados.
