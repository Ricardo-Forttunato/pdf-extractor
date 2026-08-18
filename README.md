# Quick Filler

O Quick Filler transforma cartões de ponto e holerites em PDF em dados estruturados para revisão humana. O fluxo cobre PDFs com texto nativo e PDFs escaneados/digitalizados: envio do arquivo, processamento por página, revisão lado a lado com o original, correção e download.

> Estado atual: fluxo principal validado localmente com typecheck e testes focados de pipeline, parsers e contrato HTTP.

## Funcionalidades

- Upload de PDF com seleção entre `cartao-ponto` e `holerite`.
- Construção de páginas com texto nativo e imagem renderizada para cada folha do PDF.
- Uso preferencial de texto vetorial quando o PDF já é legível; OCR local via Tesseract como fallback para páginas mistas ou escaneadas.
- Parsers de holerite e cartão de ponto preparados para múltiplas páginas, múltiplos layouts e agrupamento por dia.
- Revisão em tabela editável ao lado do PDF.
- Revisão manual terminal com rascunho editável quando a extração automática não é confiável.
- Destaques para incertezas, batidas ímpares, páginas vazias, divergência de cálculo e sequências inválidas.
- Exportação da transcrição corrigida em XLSX, CSV e JSON.
- Tratamento gracioso para documentos ilegíveis com encaminhamento para revisão manual.

## Executar localmente

Se desejar mudar parâmetros não sensíveis, copie o arquivo de exemplo; em seguida inicie o ambiente funcional:

```bash
cp .env.example .env
docker compose up --build
```

Depois, verifique a disponibilidade em `http://localhost:3000/healthz` e abra
`http://localhost:3000` no navegador.

Também é possível usar `npm run dev` para desenvolvimento. Execute `npm run typecheck`, `npm test`,
`npm run lint` e `npm run build` antes de entregar uma alteração.

O fluxo principal atual não depende de `GEMINI_API_KEY`. As variáveis `GEMINI_*` permanecem apenas
por compatibilidade com um adapter experimental de Vision que não faz parte do caminho principal de
processamento.

## Requisitos e limites

- Apenas PDFs válidos, sem senha, com no máximo 10 MiB (10.485.760 bytes).
- O processamento ocorre em memória; resultados são perdidos quando o processo reinicia e expiram após 24 horas.
- A aplicação não inventa valores. Quando a estrutura extraída não é confiável, o job termina como `ILEGIVEL_PARA_REVISAO_MANUAL` e a revisão abre um rascunho editável para preenchimento humano.
- Holerites passam por validação matemática; divergências são sinalizadas sem interromper a execução.
- Dados pessoais e conteúdo dos documentos não podem aparecer em logs.
- O ambiente Docker é a referência para avaliação funcional. Uma implantação na Vercel, quando existir, será somente uma prévia visual com dados seguros.

## Documentação

| Documento | Finalidade |
|---|---|
| [`.agents/CONTEXT.md`](.agents/CONTEXT.md) | Fonte de verdade para requisitos de produto, regras de negócio e contrato HTTP. |
| [`SOLUCAO.md`](SOLUCAO.md) | Decisões de arquitetura, execução, segurança e limitações da solução. |
| [`PROCESSO.md`](PROCESSO.md) | Registro de processo, decisões, ferramentas e verificações de desenvolvimento. |
| [`specs/001-pdf-transcription-workflow/`](specs/001-pdf-transcription-workflow/) | Especificação, plano, contratos, modelo de dados e tarefas derivados do contexto. |

Para os formatos JSON e endpoints exatos, consulte o `CONTEXT.md`; este README é a documentação oficial de apresentação e uso da aplicação, não uma segunda fonte de contrato.
