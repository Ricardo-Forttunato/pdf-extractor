# Skill: Playwright E2E

## Objetivo

Provar a jornada principal como um usuário real.

## Fixture strategy

O E2E deve usar fixtures sintéticas e determinísticas. Não depender de OCR real, cloud ou dados pessoais.

## Cenários mínimos

### E2E-001 Happy path cartão

Upload → processamento → revisão → edição → download.

### E2E-002 Happy path holerite

Upload → processamento → revisão → edição → download.

### E2E-003 Incerteza

Uma célula com `?` aparece destacada e continua editável.

### E2E-004 Erro

Upload inválido mostra mensagem útil e não trava a aplicação.

## Seletores

Preferência:

1. role;
2. label;
3. text semântico;
4. `data-testid` somente quando necessário.

Não depender de classes CSS.

## Determinismo

- não usar sleeps arbitrários;
- esperar por estado observável;
- mockar OCR externo;
- seed/fixture conhecida.

## Artefatos

CI deve guardar trace/screenshot quando E2E falhar.

## Regra

Um E2E deve ser resiliente a refactor visual que preserve comportamento.
