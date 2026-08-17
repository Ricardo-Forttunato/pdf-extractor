# Diretrizes gerais para o agente

## Fontes e escopo

1. `.agents/CONTEXT.md` é a fonte de verdade para o produto, seus requisitos e o contrato externo.
2. `.specify/memory/constitution.md` define princípios de governança e qualidade aplicáveis ao desenvolvimento.
3. Os artefatos em `specs/001-pdf-transcription-workflow/` são derivados do contexto e devem permanecer consistentes com ele.

Em caso de divergência, não altere o contrato ou requisito de produto por inferência: atualize o artefato derivado para refletir o `CONTEXT.md` ou sinalize a inconsistência ao desenvolvedor.

## Conduta de desenvolvimento

- Inspecione o código, os documentos relacionados e o estado do Git antes de mudanças relevantes. Preserve alterações preexistentes que não façam parte da tarefa.
- Faça mudanças pequenas, coesas e rastreáveis. Não amplie o escopo sem necessidade; registre cortes ou decisões de escopo em `SOLUCAO.md`.
- Mantenha as camadas de domínio, aplicação, infraestrutura, rotas e interface separadas. Não esconda regra de negócio ou validação de contrato em componentes visuais.
- Use TypeScript estrito e validação executável nas fronteiras de entrada e saída. Prefira operações puras para regras de domínio, parsing, alertas e exportação.
- Não invente comportamentos, campos, endpoints, status HTTP ou formatos de resposta ausentes do contexto. Quando o contexto não definir um detalhe, escolha a alternativa mais segura e documente a decisão em `SOLUCAO.md`.
- Não registre PII, conteúdo de documentos ou valores extraídos em logs, mensagens de erro ou fixtures. Não inclua segredos no repositório.

## Qualidade e verificação

- Priorize testes profundos para regras de negócio, contratos, conversões e fluxo crítico; evite quantidade de testes superficiais como substituto de cobertura relevante.
- Ao alterar uma fronteira HTTP, schema, parser, exportador ou fluxo crítico, execute os testes proporcionais à alteração, além de typecheck e `git diff --check` quando disponíveis.
- Antes e depois de mudanças relevantes, confira `git status` e `git diff`. Não descarte alterações de terceiros, reescreva histórico compartilhado ou crie commits sem solicitação explícita.
- Quando houver falha de interpretação, ferramenta incompatível ou código gerado que falhe, avise o desenvolvedor para registrar o aprendizado em `PROCESSO.md`.

## Fluxo Git

Use trunk-based development leve: `main` deve permanecer executável; branches curtas usam `feature/<id>-<slug>`, `fix/<slug>` ou `docs/<slug>`; commits seguem Conventional Commits e pull requests usam squash merge. Uma alteração de código deve levar consigo as atualizações de contexto, especificação e decisão que a justificam.
