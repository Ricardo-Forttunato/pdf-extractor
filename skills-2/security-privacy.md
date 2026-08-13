# Skill: Security + Privacy

## Threat model mínimo

Endpoint público recebe PDF com:

- nome;
- CPF;
- matrícula;
- salário;
- jornada.

## Upload

Aplicar:

- limite de bytes;
- validação de magic bytes;
- extensão como informação auxiliar, não como prova;
- nome aleatório no storage;
- diretório temporário;
- timeout;
- limite de concorrência.

## PDF malicioso

O parser deve rodar com recursos limitados quando a biblioteca permitir. Falha de parser deve produzir erro controlado.

## Logs

Nunca registrar:

- nome;
- CPF;
- matrícula;
- salário;
- texto OCR;
- caminho original contendo PII.

Usar:

```text
transcription_id
event
duration_ms
status
error_code
```

## Retenção

Definir explicitamente em `SOLUCAO.md`:

- o que é persistido;
- por quanto tempo;
- quando é removido;
- onde é armazenado.

## Segredos

Somente variáveis de ambiente.

Nunca:

- `.env` commitado;
- chave de OCR no código;
- token em fixture;
- segredo em screenshot/trace.

## Concorrência

Definir limite de jobs e comportamento quando excedido.

## Erros

Mensagens para o usuário devem ser úteis sem expor stack trace, caminho interno ou PII.
