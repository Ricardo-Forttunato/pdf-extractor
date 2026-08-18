# SOLUCAO.md — Decisões de solução

> Estado: implementação concluída nesta branch, com pipeline local consolidado para PDFs nativos e escaneados e política terminal de revisão manual para casos não confiáveis.

## Como rodar

```bash
cp .env.example .env
docker compose up --build
```

Esse é o modo de avaliação funcional da aplicação.

## Stack

- Next.js App Router;
- TypeScript com tipagem estrita;
- MUI Core v9 com Emotion e tabelas nativas (`Table`/`TextField`);
- `pdfjs-dist` e `@napi-rs/canvas` para leitura de texto nativo e renderização de PDF em imagem página por página;
- Tesseract.js como OCR local de fallback para páginas escaneadas ou mistas;
- ExcelJS para XLSX;
- Jest + React Testing Library e Playwright;
- Docker e Docker Compose.

Não serão usados `@mui/x-data-grid`, SQLite, worker separado, Tesseract CLI ou Poppler como dependência operacional do fluxo principal.

## Arquitetura

```text
HTTP/Interface → application → domain → infrastructure
```

Uma única aplicação Next.js executa UI, rotas HTTP e processamento assíncrono em memória. O modelo
de domínio, parsers, avisos e exportadores permanece independente de React e das rotas.

## Processamento

1. `POST /api/transcricoes` valida tipo, PDF e limite de 10 MiB e retorna o identificador conforme o `CONTEXT.md`.
2. O job é mantido em memória com estado inicial `processando`.
3. Cada página do PDF passa por dois caminhos em paralelo: extração de texto nativo com `getTextContent()` e renderização da imagem da página.
4. As páginas são classificadas como `native`, `mixed` ou `scanned` conforme a quantidade de texto útil detectada.
5. Páginas `native` seguem com o texto vetorial normalizado; páginas `mixed` e `scanned` passam por OCR local e, no caso `mixed`, o pipeline escolhe a fonte com maior densidade de texto útil.
6. O resultado textual por página é normalizado e enviado aos parsers por tipo:
   - holerite: competência, verbas (`fields[]`), bases/totais (`bases[]`) e flag `divergencia_calculo`;
   - cartão de ponto: páginas, dias e `punches[]`, com aglutinação de múltiplas linhas do mesmo dia.
7. Uma política de confiabilidade decide o fechamento automático:
   - holerites escaneados exigem competência válida, bases obrigatórias e quantidade mínima de verbas por página;
   - cartões escaneados exigem dias e batidas em quantidade mínima distribuída pelas páginas.
8. Se a estrutura não for confiável, o job termina como `ILEGIVEL_PARA_REVISAO_MANUAL`; se for confiável, segue para `concluido`.
9. O resultado fica disponível para polling, revisão e exportação durante a vida do processo.

Jobs são perdidos se o processo reiniciar; essa é uma limitação deliberada do escopo de demonstração.

## Refatoração aplicada para documentos escaneados e manuscritos

### Problema atacado

Os arquivos `payroll-02.pdf`, `payroll-03.pdf`, `payroll-04.pdf`, `time-card-02.pdf`, `time-card-03.pdf` e `time-card-04.pdf` expuseram dois limites reais do fluxo anterior:

- há PDFs escaneados sem camada de texto utilizável;
- existem páginas com múltiplos demonstrativos impressos e digitalizados juntos;
- há variação de layout, cor de fonte e organização visual;
- `time-card-04.pdf` contém formulários manuscritos com ruído alto e baixa confiabilidade para OCR textual automático.

### Decisão técnica

O pipeline foi reorientado para um fluxo determinístico local:

- toda página do PDF sempre produz:
  - texto nativo reconstruído por coordenadas, quando existir;
  - imagem renderizada da folha para fallback OCR;
- o parser de holerite passou a aceitar múltiplos layouts e múltiplos demonstrativos por página;
- o parser de cartão passou a agrupar dias repetidos e a ignorar colunas fixas de jornada;
- documentos escaneados com pouca confiabilidade são encerrados com política explícita de revisão manual, sem crash.

### Efeitos da correção

- `payroll-01/02/03` e `time-card-01/02/03` podem ser consolidados automaticamente no fluxo principal;
- `payroll-04` e `time-card-04` passam a encerrar em revisão manual terminal quando a leitura automática não é confiável;
- holerites recebem `divergencia_calculo: true` quando `líquido != proventos - descontos`, sem falha terminal;
- a interface não fica mais bloqueada nos casos terminais: a revisão cria um rascunho editável vazio e permite conclusão manual.

## Correção aplicada no commit `79a9863`

### Erro observado

Os PDFs `payroll-01.pdf` e `time-card-01.pdf` tinham camada de texto nativa, mas o pipeline ainda produzia leitura degradada na interface:

- apareciam ruídos e caracteres `?` desnecessários quando o OCR era acionado cedo demais;
- o holerite perdia a separação correta entre verbas (`fields`) e bases/totais (`bases`);
- o cartão de ponto não aglutinava corretamente linhas repetidas do mesmo dia e tratava mal dias com múltiplas linhas ou sem batidas.

### Causa raiz

O problema tinha duas causas combinadas:

1. o extrator nativo achatava o retorno do `getTextContent()` com `join(" ")`, destruindo a estrutura visual do PDF e misturando colunas distintas na mesma linha lógica;
2. o fallback para OCR considerava “texto utilizável” com um limiar muito baixo, o que permitia acionar Tesseract mesmo em páginas que já continham texto vetorial suficiente, introduzindo ruído desnecessário.

Com isso, os parsers recebiam entrada textual sem preservação de linhas/colunas e não conseguiam distinguir de forma confiável:

- verbas da tabela principal versus bases/totais do holerite;
- cabeçalho de jornada versus batidas reais no cartão;
- múltiplas linhas referentes ao mesmo dia.

### Como foi corrigido

- O extrator nativo passou a reconstruir linhas por coordenadas `x/y`, preservando a ordem visual dos itens.
- O OCR foi rebaixado para fallback estrito, disparado apenas abaixo de 50 caracteres úteis por página.
- O parser de holerite foi refeito para:
  - dividir blocos por competência (`Mês: abr-17`, `jan-18` etc.);
  - capturar verbas da tabela principal por regex orientada a código, referência e valor;
  - extrair bases e totais obrigatórios sem deixá-los vazar para `fields`.
- O parser de cartão de ponto foi refeito para:
  - detectar `Mes/Ano` do cabeçalho;
  - identificar linhas `DIA - SEMANA`;
  - aglutinar linhas repetidas do mesmo dia;
  - ignorar a coluna fixa de jornada e coletar apenas batidas reais;
  - retornar `punches: []` em dias sem registros.

O efeito esperado dessa correção é texto limpo, sem `?` introduzido artificialmente, com preenchimento consistente das tabelas de revisão e exportação.

## Comportamento terminal de revisão manual

Os casos `ILEGIVEL_PARA_REVISAO_MANUAL` deixaram de ser um beco sem saída.

- O polling retorna o status terminal explicativo.
- A tela de revisão abre mesmo sem valor estruturado persistido.
- Para `cartao-ponto`, a UI agora permite:
  - adicionar páginas;
  - adicionar dias;
  - adicionar/remover pares de batida;
  - preencher manualmente `date_raw` e `time_hhmm`.
- Para `holerite`, a UI agora permite:
  - adicionar páginas;
  - adicionar/remover verbas;
  - adicionar/remover bases;
  - preencher manualmente competência, códigos, descrições, referências e valores.
- Após salvar uma revisão manual válida, o job é promovido para `concluido` e volta a ser exportável.

## Fidelidade, revisão e exportação

- A extração tenta preservar exatamente o observado; o sistema não inventa batidas, competências nem totais.
- `date_raw` e `time_raw` preservam o valor observado quando houve leitura automática; na revisão manual, podem ser preenchidos pelo operador para viabilizar conclusão.
- `time_hhmm` e campos válidos de holerite são editáveis, desde que validem o modelo.
- Holerites exibem a referência original do demonstrativo e uma flag explícita de divergência de cálculo.
- Warnings são derivados, não persistidos no JSON.
- XLSX usa cabeçalho branco em `#173772`; amarelo `#FFF3CD`, vermelho `#F8D7DA` e borda `#DC3545`, com vermelho prioritário.

## Segurança

- Limite fixo de upload de 10 MiB (10.485.760 bytes).
- Validação de PDF, rejeição de arquivos inválidos e mensagens seguras.
- Nenhum nome, CPF, salário, conteúdo de PDF, OCR ou nome original de arquivo em logs.
- Dados de processamento permanecem somente na memória do processo e não são persistidos.

## Publicação

A Vercel hospeda apenas uma prévia visual com fixtures seguros para avaliação da interface. Upload,
OCR, estado de jobs, revisão real e exportação são avaliados exclusivamente via Docker Compose.

## Configuração e verificações

`MAX_UPLOAD_BYTES` é fixado por padrão em 10.485.760, `JOB_RETENTION_HOURS` em 24,
`OCR_TIMEOUT_MS` e `MAX_CONCURRENT_OCR_JOBS` controlam o processamento em fila. As variáveis
`GEMINI_API_KEY`/`GEMINI_VISION_MODEL` foram mantidas apenas para um adapter experimental de Vision
e não participam do fluxo principal desta solução.

Foram executados `npm run typecheck` e a suíte focada
`tests/integration/transcricoes.contract.test.ts`, `tests/unit/cartao-parser.test.ts`,
`tests/unit/holerite-parser.test.ts` e `tests/unit/document-pipeline.test.ts`. Essa cobertura valida
pipeline por página, parsers, política de revisão manual e promoção do job para `concluido` após
salvamento humano. O Playwright continua configurado, porém sua execução depende da instalação da
biblioteca de sistema `libnspr4.so` no ambiente.

## Limitações conhecidas

- Estado e resultados em memória desaparecem em reinicializações.
- OCR local em documentos manuscritos muito ruidosos continua insuficiente para automação plena.
- `payroll-04` e `time-card-04` tendem a cair em revisão manual; isso é intencional e preferível a inventar dados.
- A prévia Vercel não representa o fluxo funcional completo.
