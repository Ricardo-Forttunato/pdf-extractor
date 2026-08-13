# AGENT.md — Quick Filler

## 1. Missão

Você é um agente de engenharia responsável por implementar o desafio técnico **Quick Filler** com foco em precisão, auditabilidade, segurança, testabilidade e entrega operacional.

A regra dominante do domínio é:

> **Nunca invente um valor. Se não for possível ler com segurança, use `?`.**

O produto deve implementar o ciclo completo para **cartão de ponto** e **holerite**:

`upload PDF → processamento assíncrono → revisão editável → correção → exportação da planilha`.

O contrato HTTP definido no README é fechado e deve ser tratado como uma especificação externa: não altere nomes, métodos, status ou formatos sem uma decisão explícita e registrada.

## 2. Fonte de verdade e hierarquia

Em caso de conflito, use esta ordem:

1. contrato e regras do README do desafio;
2. `CONTEXT.md`;
3. `SPEC.md`;
4. ADRs/decisões registradas;
5. skills deste diretório;
6. convenções do framework e bibliotecas;
7. preferência pessoal do agente.

**Nunca** "melhore" silenciosamente um requisito fechado.

## 3. Stack alvo

- TypeScript com `strict: true`;
- Next.js como framework da aplicação;
- React;
- MUI como Design System;
- Jest + Testing Library para unit/integration;
- Playwright para E2E;
- Docker + `docker compose`;
- CI mínima: lint + typecheck + testes;
- processamento isolado do PDF/OCR por uma camada de domínio/adaptador.

## 4. Arquitetura obrigatória

Organize o código por responsabilidades, não por endpoint:

```text
src/
  app/                       # UI + route handlers do Next
  domain/
    transcription/
    document/
    warnings/
    export/
  application/
    commands/
    queries/
  infrastructure/
    pdf/
    ocr/
    storage/
    export/
  components/
  lib/
  schemas/
  test/
```

Princípios:

- domínio não conhece React, Next, filesystem ou banco;
- adapters externos são substituíveis;
- validação de entrada acontece na borda;
- contratos de API têm schemas executáveis;
- valores extraídos mantêm representação `_raw` quando especificada;
- warnings são derivados e não persistidos;
- exportação consome o modelo corrigido, nunca uma cópia divergente.

## 5. Spec-driven development

Antes de implementar uma feature:

1. localize a regra em `CONTEXT.md`/`SPEC.md`;
2. transforme a regra em critérios verificáveis;
3. escreva ou atualize testes que expressem o comportamento;
4. implemente o mínimo necessário;
5. execute os quality gates;
6. registre decisões e lacunas.

Toda mudança que alterar contrato, modelo, segurança ou comportamento relevante exige atualização da especificação e dos testes.

## 6. Looping engineering

Não considere uma tarefa concluída após "o código compilar".

Para cada incremento, execute:

```text
OBSERVE
  ↓
SPECIFY
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
VERIFY
  ↓
ADVERSARIAL REVIEW
  ↓
FIX
  ↓
RE-VERIFY
```

### OBSERVE
Inspecione arquivos, contratos, testes existentes e comportamento atual.

### SPECIFY
Defina entrada, saída, invariantes, erros e critérios de aceite.

### PLAN
Escolha a menor mudança que satisfaz a especificação.

### IMPLEMENT
Implemente com separação de domínio/infra/UI.

### VERIFY
Rode lint, typecheck, unit/integration, E2E e testes de contrato relevantes.

### ADVERSARIAL REVIEW
Tente quebrar a implementação com:
- PDF inválido;
- PDF vazio;
- PDF escaneado;
- OCR ambíguo;
- `?`;
- data impossível;
- mês inválido;
- batidas ímpares;
- competências não sequenciais;
- páginas vazias;
- uploads simultâneos;
- arquivo grande;
- input malicioso;
- edição inválida;
- exportação sem dados.

### FIX
Corrija a causa, não apenas o teste.

### RE-VERIFY
Execute novamente os gates relevantes e depois a suíte completa antes de declarar pronto.

## 7. Harness engineering

O repositório deve dificultar estados inválidos e tornar falhas observáveis.

O harness deve incluir:

- scripts determinísticos de `lint`, `typecheck`, `test`, `test:coverage`, `test:e2e`;
- fixtures versionadas;
- dados sintéticos sem PII real;
- testes de contrato dos endpoints;
- healthcheck;
- logs sem conteúdo sensível;
- validação de tamanho e MIME/magic bytes do PDF;
- timeout e limite de concorrência definidos;
- testes de exportação;
- CI reproduzível;
- Docker reproduzível;
- comandos de uma linha para validar a entrega.

### Definition of Done

Uma tarefa só está pronta quando:

- [ ] comportamento especificado;
- [ ] testes representando o requisito;
- [ ] implementação mínima;
- [ ] `typecheck` passa;
- [ ] lint passa;
- [ ] testes unitários/integration passam;
- [ ] E2E afetado passa;
- [ ] cobertura crítica não caiu;
- [ ] nenhum segredo/PII foi introduzido;
- [ ] documentação/ADR atualizada quando necessário.

## 8. Regras de domínio

### Cartão de ponto

- preservar a ordem dos dias;
- preservar `date_raw`;
- preservar `time_raw`;
- normalizar `time_hhmm`;
- `kind` somente `IN` ou `OUT`;
- batidas ímpares geram warning derivado;
- datas não sequenciais geram warning derivado;
- datas impossíveis não podem ser aceitas como válidas;
- caractere ilegível vira `?`.

### Holerite

- `fields` contém somente verbas da tabela principal;
- `bases` contém somente bases/totais da seção separada;
- `code` vazio quando não existir;
- `reference` vazio quando não existir;
- valores monetários permanecem strings brasileiras;
- `month` deve estar entre `"01"` e `"12"`;
- mês não sequencial gera warning derivado;
- página sem dados gera warning derivado;
- `?` permanece por caractere.

## 9. Segurança

Nunca:

- registre CPF, salário, matrícula, nome ou conteúdo de PDF em logs;
- persista arquivo além da política documentada;
- aceite upload ilimitado;
- confie apenas no `Content-Type`;
- processe arquivo corrompido como se fosse válido;
- gere saída baseada em dados não validados.

Sempre:

- limite bytes;
- valide PDF;
- trate concorrência;
- aplique timeout;
- sanitize nomes;
- use diretório temporário isolado;
- remova temporários conforme política;
- trate erro de OCR/extractor sem produzir dados inventados.

## 10. Comandos esperados

O `package.json` deve oferecer, no mínimo:

```text
lint
typecheck
test
test:coverage
test:e2e
test:e2e:ui
build
```

E o Docker deve permitir:

```bash
docker compose up --build
```

## 11. Comportamento de agente

Antes de editar:

- leia o arquivo inteiro quando a mudança depender de contexto;
- procure usos existentes;
- não duplique abstrações;
- não faça refactor não relacionado.

Depois de editar:

- mostre o que mudou;
- informe testes executados;
- informe limitações;
- se uma premissa do enunciado não puder ser garantida, registre-a explicitamente.

## 12. Proibições

- Não trocar `?` por vazio.
- Não "corrigir" OCR sem evidência.
- Não arredondar valores monetários.
- Não ordenar registros que o contrato exige preservar na ordem do documento.
- Não persistir warnings como campos do JSON.
- Não alterar contrato HTTP para facilitar a implementação.
- Não marcar E2E como "skip" para esconder falhas sem justificativa.
- Não aumentar cobertura artificialmente com testes sem assertions significativas.
