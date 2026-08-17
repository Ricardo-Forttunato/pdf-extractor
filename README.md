# Quick Filler

O Quick Filler transforma cartões de ponto e holerites em PDF em planilhas estruturadas para revisão humana. O fluxo é único para os dois tipos de documento: envio do PDF, processamento, revisão lado a lado com o original, correção e download.

> Estado atual: aplicação implementada e validada localmente com typecheck, Jest, lint e build de produção.

## Funcionalidades

- Upload de PDF com seleção entre `cartao-ponto` e `holerite`.
- Extração de texto nativo com OCR como fallback para PDFs digitalizados.
- Revisão em tabela editável ao lado do PDF.
- Destaques para incertezas, batidas ímpares, páginas vazias e sequências inválidas.
- Exportação da transcrição corrigida em XLSX, CSV e JSON.

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

## Requisitos e limites

- Apenas PDFs válidos, sem senha, com no máximo 10 MiB (10.485.760 bytes).
- O processamento ocorre em memória; resultados são perdidos quando o processo reinicia e expiram após 24 horas.
- A aplicação não inventa valores: caracteres ilegíveis são representados por `?`.
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
