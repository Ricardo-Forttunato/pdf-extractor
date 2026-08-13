# CONTEXT.md — Quick Filler

## Objetivo

Construir uma aplicação web pública que recebe PDFs de cartões de ponto e holerites, processa a transcrição, permite revisão/correção humana e gera planilha.

Fluxo:

`upload → processar → revisar → editar → baixar`

O README informa que o desafio representa uma versão reduzida de um produto real que precisa lidar com muitos layouts, PDFs escaneados e OCR imperfeito. A precisão é mais importante que uma falsa sensação de sucesso.

## Restrições de negócio

1. Nunca inventar valor.
2. Caractere ilegível = `?`.
3. Nunca produzir data impossível.
4. Preservar o valor bruto e a interpretação quando o contrato pedir ambos.
5. Warnings são derivados do dado.
6. Os dois tipos compartilham o pipeline e divergem apenas na extração/modelagem/exportação.

Essas regras são explícitas no desafio. 

## Contrato HTTP

### POST `/api/transcricoes`

`multipart/form-data`

- `arquivo`: PDF
- `tipo`: `cartao-ponto | holerite`

Resposta:

`202 { "id": "abc123" }`

### GET `/api/transcricoes/:id`

Retorna:

- `id`
- `tipo`
- `status`: `processando | concluido | erro`
- `erro`
- `value`

Durante `processando`, `value = null`. Em `erro`, `erro` deve ser legível.

### PUT `/api/transcricoes/:id`

Recebe `{ "value": { ... } }` e substitui a transcrição pelas correções feitas na UI.

### GET `/api/transcricoes/:id/planilha`

Exporta a transcrição corrigida.

Formatos:

- xlsx (Preferencial);
- csv;
- json.

### GET `/healthz`

Retorna 200 quando a aplicação está de pé.

## Interface

A interface precisa ter:

- upload de PDF + tipo (cartão de ponto ou holerite, se possivel o tipo deve ser detectado automaticamente);
- feedback de progresso;
- tabela editável;
- avisos destacados;
- PDF ao lado da tabela;
- download refletindo as edições.

Não há requisito de login nem de design elaborado.

## Operação

Obrigatórios:

- Dockerfile;
- docker-compose;
- `docker compose up` deve subir tudo;
- aplicação publicada;
- configuração por ambiente;
- nenhum segredo no repositório.

CI mínima com lint + testes é diferencial.

## Segurança e privacidade

O endpoint é público e pode receber PII e dados financeiros.

Devem existir:

- limite de upload;
- validação de PDF;
- tratamento para corrompido/grande/concor­rente;
- política de retenção em `SOLUCAO.md`;
- ausência de PII nos logs.


## Critérios de produto

### Cartão de ponto

Uma linha por dia, na ordem do documento. Cada linha contém pares entrada/saída. O export precisa criar `Data`, `Entrada 1`, `Saída 1`, etc.

### Holerite

`fields` representa somente a tabela principal de verbas. `bases` representa bases e totais da seção separada. A planilha transpõe as verbas para colunas distintas na ordem da primeira aparição.

## Warnings

Cartão:

- batidas ímpares;
- data não sequencial.

Holerite:

- página vazia;
- mês não sequencial.

São calculados na apresentação/exportação, não armazenados no contrato.

## Prioridade em conflitos visuais

- amarelo `#FFF3CD`: linha com batidas ímpares, página vazia ou `?`;
- vermelho `#F8D7DA`: data/mês não sequencial;
- vermelho vence quando ambos se aplicam;
- primeira célula da linha vermelha recebe borda esquerda `#DC3545`.

## Processo de entrega

O repositório deve conter:

- `SOLUCAO.md`;
- `PROCESSO.md`;
- planilhas geradas a partir dos PDFs de exemplo.

O `PROCESSO.md` deve documentar ferramentas de IA, erros do agente, reescritas manuais e três decisões ambíguas, além de pontos de quebra e baixa confiança.

## O que não fazer cedo

Não priorizar bônus antes do fluxo principal estar sólido:

- rastreabilidade visual;
- detecção automática do tipo;
- ficha financeira;
- layout desconhecido.

O próprio desafio classifica esses itens como bônus.

## Sencibilidade de dados

A aplicação processa documentos de funcionarios que podem conter informações pessoais e financeiras.

Informações potencialmente sensíveis incluem:

- nomes de funcionários;
- CPF;
- identificadores internos de funcionários;
- salarios e compensações;
- horários de trabalho;
- informações de emprego;
- informações extraídas de holerites;
- informações extraídas de cartões de ponto.

A aplicação deve tratar os documentos enviados e os dados de transcrição extraídos como dados sensíveis.

### PII

PII significa Informações Pessoais Identificáveis.

O sistema deve assumir que o conteúdo do documento pode conter PII mesmo quando um campo específico não é explicitamente identificado como PII.

A ausência de um CPF não torna um documento seguro para registro em log ou exposição.

### Logging

Logs da aplicação não devem conter:

- document contents;
- conteudo do PDF;
- OCR output;
- nomes de funcionários;
- CPF;
- identificadores internos de funcionários;
- salary values;
- valor do salário;
- horários de trabalho;
- nome do arquivo original quando ele possa conter informações pessoais.

Logs devem usar identificadores opacos como `transcriptionId`.

## Estratégia técnica recomendada

### Framework

Use **Next.js** como aplicação principal.

### Persistência

Para um desafio de ~14 horas, priorize uma implementação simples e substituível:

- armazenamento temporário/local no desenvolvimento;
- estado da transcrição em memória ou storage simples, desde que o comportamento em deploy seja explicitado;
- adapter de storage;
- TTL/limpeza;
- nenhuma persistência de PII além do necessário.

Se a plataforma de deploy possuir filesystem efêmero, documentar isso.

### Processamento

Não acople OCR diretamente à API route.

```text
HTTP
 ↓
Application command
 ↓
DocumentProcessor
 ├── PDF text extractor
 └── OCR adapter
 ↓
Domain parser
 ↓
Validated transcription
 ↓
Storage
```

### Assíncrono

O `POST` retorna 202 e um ID. O processamento deve continuar fora do request de upload. Para o desafio, um job runner simples pode ser suficiente, desde que:

- status seja observável;
- erro seja persistido;
- concorrência seja limitada;
- não exista race condition entre processamento e PUT.

## Qualidade

O teste não deve apenas verificar happy path. A prioridade é:

1. invariantes do domínio;
2. contrato HTTP;
3. parsing/OCR;
4. warnings;
5. export;
6. UI crítica;
7. E2E do fluxo completo.

## Definition of Done global

- API fechada e testada;
- domínio sem dependências de framework;
- dados inválidos rejeitados;
- incerteza preservada;
- testes de regressão para cada bug;
- E2E upload → processamento → revisão → download;
- Docker funcionando;
- healthcheck;
- logs sem PII;
- documentação de limitações;
- CI verde.
