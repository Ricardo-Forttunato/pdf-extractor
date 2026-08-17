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
- OCR em Node.js com `pdfjs-dist` para texto nativo e `tesseract.js` como fallback.
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
- Validações executadas: `npm run typecheck`, `npm test`, `npm run lint` e `npm run build`.
- A imagem foi validada por `docker compose build` e `docker compose up`; o health check retornou
  `200` em `/healthz` antes da remoção do ambiente temporário.
- O Playwright foi configurado e o Chromium baixado. A execução não iniciou por ausência de
  `libnspr4.so`; a tentativa de `playwright install-deps chromium` exigiu senha de administrador.
- A instalação de dependências exigiu acesso ao registro npm. O relatório de dependências informa
  vulnerabilidades transitivas; nenhuma atualização automática ou quebra de versão foi aplicada.
