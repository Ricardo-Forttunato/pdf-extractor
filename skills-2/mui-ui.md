# Skill: MUI

## Objetivo

Criar uma interface profissional sem criar um design system desnecessário.

## Princípios

- componentes pequenos;
- acessibilidade;
- estados explícitos;
- feedback durante processamento;
- tabela editável;
- PDF visível ao lado;
- cores do contrato para warnings.

## Estados da tela

```text
idle
uploading
processing
ready
saving
error
```

Cada estado deve ser testável.

## Styling

Centralizar tokens de domínio:

```text
warningYellow = #FFF3CD
warningRed = #F8D7DA
warningBorder = #DC3545
excelHeader = #173772
```

Não espalhar hex codes pelo código.

## Acessibilidade

- labels reais;
- foco visível;
- mensagens de erro associadas;
- botões com nome acessível;
- tabela com headers;
- upload acionável por teclado.

## PDF

O PDF deve ser consultável sem abrir uma segunda janela. Se o browser não suportar o preview de determinado fixture, mostrar fallback compreensível.
