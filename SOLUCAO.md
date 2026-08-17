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
- `pdfjs-dist` para extração de texto nativo;
- `tesseract.js` em Node.js como fallback de OCR;
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
3. A extração tenta texto nativo; páginas sem texto utilizável seguem para `tesseract.js`.
4. Parsers criam o modelo de Cartão de Ponto ou Holerite, sem inventar valores.
5. O resultado validado fica disponível para polling, revisão e exportação durante a vida do processo.

Jobs são perdidos se o processo reiniciar; essa é uma limitação deliberada do escopo de demonstração.

## Fidelidade, revisão e exportação

- `?` só marca caracteres não reconhecidos pelo OCR.
- `date_raw` e `time_raw` preservam o valor observado e são somente leitura.
- `time_hhmm` e campos válidos de Holerite são editáveis, desde que validem o modelo.
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
`OCR_TIMEOUT_MS` limita cada tentativa de OCR e `MAX_CONCURRENT_OCR_JOBS` mantém o processamento
em uma fila de uma tarefa. Nenhuma dessas configurações contém segredos.

Foram executados `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` e a construção
Docker, cujo `/healthz` retornou 200. A suíte cobre parsers, validação, avisos, exportadores/XLSX e
contrato de rotas. O Playwright está configurado, porém sua execução depende da instalação da
biblioteca de sistema `libnspr4.so` (o ambiente atual não possui privilégio administrativo).

## Limitações conhecidas

- Estado e resultados em memória desaparecem em reinicializações.
- O processamento é limitado a uma instância Docker e aos PDFs de exemplo em `samples/`.
- A prévia Vercel não representa o fluxo funcional completo.
