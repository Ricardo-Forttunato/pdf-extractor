# SOLUCAO.md — Decisões de solução

> Estado: implementação concluída nesta branch.

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
- `pdfjs-dist` e `@napi-rs/canvas` para renderização de PDF em imagem página por página;
- OpenAI Responses API com entrada de imagem e saída estruturada em JSON Schema para OCR/Vision;
- ExcelJS para XLSX;
- Jest + React Testing Library e Playwright;
- Docker e Docker Compose.

Não serão usados `@mui/x-data-grid`, SQLite, worker separado, Tesseract CLI ou Poppler.

## Arquitetura

```text
HTTP/Interface → application → domain → infrastructure
```

Uma única aplicação Next.js executa UI, rotas HTTP e processamento assíncrono em memória. O modelo
de domínio, parsers, avisos e exportadores permanece independente de React e das rotas.

## Processamento

1. `POST /api/transcricoes` valida tipo, PDF e limite de 10 MiB e retorna o identificador conforme o `CONTEXT.md`.
2. O job é mantido em memória com estado inicial `processando`.
3. Todo PDF é convertido em imagem PNG página por página antes da extração.
4. Cada imagem é enviada ao fluxo de Vision com prompt por tipo de documento e schema JSON estruturado.
5. Holerites são consolidados em `reference`, `fields`, `bases` e `divergence_calculo`.
6. Cartões de ponto são consolidados em `days` e `punches`; páginas ilegíveis podem terminar em `ILEGIVEL_PARA_REVISAO_MANUAL`.
7. O resultado validado fica disponível para polling, revisão e exportação durante a vida do processo.

Jobs são perdidos se o processo reiniciar; essa é uma limitação deliberada do escopo de demonstração.

## Refatoração aplicada para documentos escaneados e manuscritos

### Problema atacado

Os arquivos `payroll-02.pdf`, `payroll-03.pdf`, `payroll-04.pdf`, `time-card-02.pdf`, `time-card-03.pdf` e `time-card-04.pdf` não são tratados com confiabilidade por uma estratégia baseada em parser rígido sobre texto nativo ou OCR textual simples:

- há PDFs escaneados sem camada de texto utilizável;
- existem páginas com múltiplos demonstrativos impressos e digitalizados juntos;
- há variação de layout, cor de fonte e organização visual;
- `time-card-04.pdf` contém formulários manuscritos com ruído alto e baixa confiabilidade para OCR posicional tradicional.

### Decisão técnica

O pipeline foi reorientado para visão layout-agnóstica:

- todo PDF é renderizado como imagem por página;
- a extração é feita sobre imagem, não mais sobre texto embutido do PDF;
- holerite usa schema JSON dinâmico para `reference`, totais e lista de itens;
- cartão de ponto usa schema JSON com retorno estruturado de dias/batidas ou status de ilegibilidade.

### Efeitos da correção

- PDFs escaneados passam a usar o mesmo fluxo dos PDFs nativos;
- payrolls com múltiplos demonstrativos na mesma página física podem gerar múltiplos `statements`;
- holerites recebem `divergence_calculo: true` quando `líquido != proventos - descontos`, sem falha terminal;
- cartões manuscritos ou excessivamente ruidosos encerram em `ILEGIVEL_PARA_REVISAO_MANUAL`, sem crash da aplicação.

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

## Fidelidade, revisão e exportação

- A extração tenta preservar exatamente o observado; o sistema não inventa batidas, competências nem totais.
- `date_raw` e `time_raw` preservam o valor observado e são somente leitura.
- `time_hhmm` e campos válidos de Holerite são editáveis, desde que validem o modelo.
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
`OCR_TIMEOUT_MS` e `MAX_CONCURRENT_OCR_JOBS` continuam controlando o processamento em fila, e
`OPENAI_API_KEY`/`OPENAI_VISION_MODEL` configuram a integração de Vision. Apenas a chave da OpenAI
é secreta.

Foram executados `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` e a construção
Docker, cujo `/healthz` retornou 200. A suíte cobre parsers, validação, avisos, exportadores/XLSX e
contrato de rotas, incluindo adapter de Vision, warnings de divergência de cálculo e status de
revisão manual. O Playwright está configurado, porém sua execução depende da instalação da
biblioteca de sistema `libnspr4.so` (o ambiente atual não possui privilégio administrativo).

## Limitações conhecidas

- Estado e resultados em memória desaparecem em reinicializações.
- O processamento real depende de `OPENAI_API_KEY` válida.
- O status `ILEGIVEL_PARA_REVISAO_MANUAL` encerra o job sem gerar valor editável/exportável.
- A prévia Vercel não representa o fluxo funcional completo.
