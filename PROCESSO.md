# PROCESSO.md — Registro de desenvolvimento

## Ferramentas utilizadas

| Ferramenta | Finalidade |
|---|---|
| Codex / agentes | Análise de requisitos, implementação assistida, documentação e revisão |
| Git | Controle de versão, inspeção de histórico e validação de alterações |
| GitHub SpecKit | Geração e manutenção dos artefatos de especificação |

## Fluxo de trabalho

- Branch principal do ciclo: `feature/001-pdf-transcription-workflow`
- Estratégia de integração: branch curta com squash merge em `main`
- Convenção de commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Verificações antes do fechamento: `git diff --check`, typecheck, testes relevantes e E2E quando aplicável

## Premissas adotadas antes da implementação

- `CONTEXT.md` é a fonte de verdade para contrato HTTP e regras do desafio.
- O ambiente oficial de avaliação é `docker compose up`.
- A solução deveria evitar persistência de estado fora do processo.
- O pipeline precisaria atender PDFs nativos e escaneados sem depender de serviços externos como caminho principal.
- `?` deveria representar apenas incerteza real de leitura, não mascarar dado claramente identificado.

## Linha de desenvolvimento

1. Estruturação inicial do projeto com Next.js, TypeScript estrito, MUI Core e rotas contratuais.
2. Implementação do fluxo base de upload, polling, revisão e exportação.
3. Correção do empacotamento de runtime OCR no Docker para execução fora do ambiente de desenvolvimento.
4. Correção do defeito de extração/parsing em PDFs nativos:
   - o texto estava sendo achatado
   - o OCR era acionado cedo demais
   - os parsers recebiam entrada degradada
5. Tentativa experimental com Vision/Gemini para casos mais difíceis; a abordagem foi descartada como caminho principal por instabilidade operacional e estrutural.
6. Refatoração do pipeline para processamento por página com classificação `native`/`mixed`/`scanned`, OCR local de fallback e política explícita de revisão manual.
7. Consolidação do comportamento terminal de revisão manual para permitir edição e exportação após correção humana.

## Resultado funcional observado

- `payroll-01`, `payroll-02`, `payroll-03`: fechamento automático esperado
- `time-card-01`, `time-card-02`, `time-card-03`: fechamento automático esperado
- `payroll-04` e `time-card-04`: revisão manual terminal esperada

## Verificações executadas

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`

A cobertura atual valida contrato HTTP, pipeline documental, parsers, revisão manual, exportação, rota de saúde e smoke test E2E da tela inicial.
