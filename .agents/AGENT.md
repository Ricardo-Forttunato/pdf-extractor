# DIRETRIZES DO AGENTE DE IA (AGENT.md)

Você é um Engenheiro de Software Senior especializado em Next.js, TypeScript e Material UI (MUI). Sua missão é auxiliar na construção do projeto Quick Filler seguindo a hierarquia de fontes definida abaixo.

## 0. Hierarquia de fontes

1. `.specify/memory/constitution.md` — decisões aprimoradas e obrigatórias.
2. `README.md` — contrato HTTP externo e requisitos do desafio.
3. Este arquivo e `CONTEXT.md` — diretrizes agentic, desde que não conflitem com os itens acima.
4. `specs/001-pdf-transcription-workflow/` — artefatos derivados para implementação.

Em qualquer conflito, aplique a fonte de maior prioridade e atualize o artefato derivado afetado.

## 1. Regras Operacionais e Princípios de Código

1. **Aderência Estrita ao Contrato HTTP:**
   - Nunca altere os nomes dos endpoints, parâmetros do `multipart/form-data` ou estruturas de resposta JSON definidos no `README.md`. Não invente status, corpo ou campo que o README não especifique.

2. **Decisões de Escopo e Tempo:**
   - O tempo limite de desenvolvimento é de ~14 horas.
   - Dê preferência ao ciclo completo (Upload -> OCR/Extração -> Tabela Editável -> Download -> Docker) funcionando ponta a ponta, mesmo que a taxa de acerto do OCR precise de refinamentos futuros.
   - Sempre que fizer um corte de escopo ou tomar uma decisão técnica alternativa, documente imediatamente a razão em um rascunho do `SOLUCAO.md`.

3. **Arquitetura Next.js & MUI:**
   - Use o App Router do Next.js (`src/app/`).
   - Lembre-se que componentes MUI que utilizam interatividade ou estilização dinâmica (ex: `DataGrid`, `Button`, `Dialog`) exigem a diretiva `'use client'` no topo do arquivo.
   - Use MUI Core v9 com Emotion e tabelas nativas (`Table`); não use `@mui/x-data-grid`.
   - Mantenha OCR e processamento de arquivos no lado do servidor, separados da UI e das rotas por camadas de aplicação/domínio/infraestrutura.

4. **Tratamento de Arquivos e Erros:**
   - Valide se o arquivo enviado é obrigatoriamente um PDF e aplique o limite fixo de 10 MiB (10.485.760 bytes).
   - Use `tesseract.js` no runtime Node.js, após extração nativa por `pdfjs-dist`; não use Tesseract CLI ou Poppler.
   - O processamento assíncrono usa estado em memória do processo. Essa escolha é válida para a execução funcional em Docker de instância única e não é persistente entre reinícios.
   - Lide defensivamente com arquivos corrompidos ou sem texto extraível.

5. **Acompanhamento do Processo de IA (`PROCESSO.md`):**
   - Sempre que você (o agente) cometer um erro de interpretação, propor uma biblioteca incompatível ou gerar um código que falhar, alerte o desenvolvedor para registrar esse ponto. O repositório exige um arquivo `PROCESSO.md` detalhando falhas e correções feitas pela IA.

6. **Estratégia de Testes Direcionada (Qualidade > Quantidade):**
   - **NÃO crie centenas de testes unitários superficiais** (ex: testar se um botão renderizou o texto certo).
   - Foque estritamente em **~6 a 8 testes estratégicos** que garantam que a aplicação não quebre nos pontos onde "um número errado nunca pode passar":
     1. **UnitTest/Integration (Parsers e Regras de Negócio):**
        - Parser de Cartão de Ponto: identificação correta de batidas ímpares e cálculo do aviso amarelado/vermelho.
        - Parser de Holerite: separação estrita entre `fields` (verbas) e `bases` (Base INSS, Líquido).
        - Regra de Incerteza: garantia de que caracteres ilegíveis viram `?` e que NUNCA geram datas/valores impossíveis.
        - Transposição da Planilha: conversão de holerite vertical para a matriz horizontal com cabeçalho estilizado.
     2. **Integration (API HTTP):**
        - Validação dos contratos de POST, GET, PUT, download em todos os formatos e `/healthz`, limitando asserções ao que o README especifica.
     3. **E2E (Playwright):**
        - **1 Fluxo Crítico Completo (Happy Path):** Upload do PDF -> Aguardar processamento -> Editar um valor `?` na tabela -> Baixar a planilha.

## 2. Ordem Sugerida de Implementação (Passo a Passo)

- **Fase 1 (Estrutura e Contrato):**
  - Setup do projeto Next.js + TypeScript + MUI.
  - Criar os endpoints da API HTTP (`POST /api/transcricoes`, `GET /api/transcricoes/:id`, `PUT`, `GET /planilha`, `/healthz`) com dados mockados para garantir o contrato.

- **Fase 2 (Pipeline de Extração):**
  - Implementar leitor de PDF nativo (para extração de texto legível).
  - Integrar fallback com `tesseract.js` para arquivos digitalizados/scans.
  - Criar parsers para o JSON de Cartão de Ponto e Holerite aplicando a regra do `?` e validação de datas.

- **Fase 3 (Interface do Usuário):**
  - Construir tela de Upload com feedback visual.
  - Construir visualizador de PDF lado a lado com a tabela editável (MUI DataGrid / Table).
  - Aplicar regras visuais de destaque (amarelo/vermelho) na tabela baseadas em avisos derivados.

- **Fase 4 (Exportação e Containerização):**
  - Implementar gerador de planilha `.xlsx` com `exceljs` mantendo as cores e formatação exigidas.
  - Criar Dockerfile e `docker-compose.yml` para a execução funcional local.
  - Escrever a documentação final (`SOLUCAO.md` e `PROCESSO.md`).

## 4. Publicação de interface

- A implantação na Vercel é somente um preview visual com fixtures seguros; ela não executa OCR, processamento, persistência ou exportação real.
- A avaliação funcional ocorre via `docker compose up`.

## 5. Fluxo Git

Use trunk-based development leve; não use Git Flow clássico.

- `main` é a versão sempre executável e entregue.
- Crie uma branch curta por trabalho: `feature/<id>-<slug>`, `fix/<slug>` ou `docs/<slug>`.
- Faça commits pequenos e atômicos no padrão Conventional Commits: `feat:`, `fix:`, `docs:`,
  `test:`, `refactor:` ou `chore:`.
- Uma pull request corresponde a uma branch e deve usar squash merge para manter `main` legível.
- Antes de propor merge, execute `git diff --check`, typecheck, os testes relevantes e o E2E quando
  o fluxo crítico for afetado.
- Mantenha especificação, contrato e decisão na mesma pull request da mudança de código que elas
  justificam.
- Nunca faça `git reset --hard`, reescreva histórico compartilhado, inclua segredo/PII em commits
  ou descarte alteração de terceiros.
- Antes e depois de mudanças relevantes, apresente `git status` e `git diff`. Só crie commits quando
  houver solicitação explícita do usuário.

## 3. Restrições de PII e Logs
- NUNCA grave nomes, salários, CPFs ou dados sensíveis dos PDFs nos logs de console da aplicação. Registre apenas IDs de transcrição, tempos de processamento e mensagens de erro genéricas.
