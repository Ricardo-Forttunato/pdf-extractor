# ADR-002 — Design System e estratégia de estilização

## Status

Accepted

## Contexto

A aplicação precisa de uma interface consistente para o fluxo completo de:

- envio do PDF;
- acompanhamento do processamento;
- visualização da transcrição;
- revisão e edição dos dados;
- indicação visual de problemas;
- visualização do PDF;
- download da planilha.

O projeto inicialmente considerava o uso de MUI em conjunto com `styled-components`.

Durante o planejamento, identificamos que manter duas soluções de estilização aumentaria a quantidade de decisões disponíveis para os agentes e poderia resultar em uma interface inconsistente.

O desafio também exige consistência visual entre a interface de revisão e as planilhas geradas. Os estados de alerta devem utilizar as mesmas cores e representar semanticamente os mesmos problemas.

## Decisão

Utilizar **MUI como Design System único da aplicação**.

A estratégia de estilização será baseada nos recursos nativos do MUI:

1. componentes MUI;
2. `Theme` e design tokens;
3. propriedades dos componentes;
4. `sx`;
5. `styled()` do próprio MUI quando necessário.

A aplicação **não utilizará `styled-components`**.

Também não serão introduzidos outros frameworks ou bibliotecas de estilização sem uma decisão arquitetural específica.

## Design Tokens

Valores visuais compartilhados devem ser centralizados no tema da aplicação sempre que fizer sentido.

Exemplos:

- cores;
- espaçamentos;
- tipografia;
- bordas;
- estados de interação;
- estados de revisão.

As cores relacionadas à revisão devem refletir as especificações do desafio:

- aviso: `#FFF3CD`;
- erro: `#F8D7DA`;
- borda de erro: `#DC3545`.

Quando uma linha possuir mais de uma condição, o estado vermelho deve prevalecer sobre o amarelo.

## Hierarquia de estilização

Os agentes devem seguir esta ordem de preferência:

### 1. Componentes MUI

Sempre que existir um componente MUI adequado, utilizá-lo antes de criar um componente visual próprio.

### 2. Theme / Design Tokens

Valores compartilhados devem utilizar o tema em vez de valores arbitrários espalhados pelo código.

### 3. `sx`

Utilizar `sx` para customizações específicas de componentes.

### 4. `styled()` do MUI

Utilizar somente quando a customização for estrutural ou reutilizável e `sx` não for suficiente.

### 5. CSS específico

CSS adicional somente quando houver uma necessidade concreta que não seja adequadamente atendida pelo MUI.

A introdução de uma nova solução de styling exige justificativa e revisão arquitetural.

## Componentes de domínio

Quando uma regra visual representa um conceito do domínio, deve-se preferir um componente semântico em vez de repetir estilos.

Exemplo:

```tsx
<ReviewIssue severity="warning">
  Batidas ímpares
</ReviewIssue>
```

em vez de espalhar condicionais e códigos de cor pela aplicação.

Isso permite que a regra visual seja centralizada e reutilizada entre tabela, revisão e outros pontos da interface.

## Alternativas consideradas

### MUI + styled-components

**Vantagens:**

- flexibilidade de CSS-in-JS;
- familiaridade com styled-components;
- possibilidade de criar componentes estilizados.

**Desvantagens:**

- duas abstrações de styling;
- maior superfície de decisão para agentes;
- maior possibilidade de inconsistência;
- dependência adicional;
- necessidade de definir quando utilizar MUI, `sx` ou `styled-components`.

**Decisão:** rejeitada.

### MUI + Emotion diretamente

**Vantagens:**

- integração com o ecossistema MUI;
- flexibilidade de CSS-in-JS.

**Desvantagens:**

- adiciona uma camada de implementação que não é necessária para o desafio;
- aumenta a quantidade de decisões de styling expostas à aplicação.

**Decisão:** rejeitada como API de styling utilizada diretamente pela aplicação.

### Tailwind CSS

**Vantagens:**

- velocidade de desenvolvimento;
- sistema de classes utilitárias;
- ampla adoção.

**Desvantagens:**

- criaria uma segunda abordagem em relação ao MUI;
- duplicaria responsabilidades do Design System;
- não é necessária para atender ao escopo do desafio.

**Decisão:** rejeitada.

### CSS Modules

**Vantagens:**

- simples;
- baixo acoplamento;
- adequado para estilos locais.

**Desvantagens:**

- adicionaria uma segunda estratégia de styling;
- não aproveita diretamente o sistema de tokens e componentes do MUI.

**Decisão:** não será a estratégia padrão. Poderá ser utilizado excepcionalmente se existir uma necessidade técnica concreta e documentada.

## Consequências

### Positivas

- uma única fonte de verdade para o Design System;
- menor complexidade para os agentes;
- menor quantidade de dependências;
- maior consistência visual;
- tokens centralizados;
- componentes reutilizáveis;
- facilidade para manter os estados visuais de revisão consistentes;
- menor risco de decisões divergentes entre diferentes partes da aplicação.

### Negativas

- dependência maior do ecossistema MUI;
- algumas customizações muito específicas podem exigir conhecimento maior do sistema de tema;
- determinados estilos altamente personalizados podem exigir `styled()` ou CSS adicional.

Essas limitações são consideradas aceitáveis para o escopo e o prazo do desafio.

## Regras para agentes

Os agentes devem:

- utilizar componentes MUI sempre que possível;
- reutilizar tokens do tema;
- evitar valores visuais duplicados;
- não instalar `styled-components`;
- não introduzir Tailwind ou outro framework de styling;
- não criar componentes visuais duplicados quando um componente existente puder ser reutilizado;
- preferir componentes semânticos para estados relacionados ao domínio;
- validar visualmente componentes importantes através dos testes e2e quando aplicável.

Antes de introduzir uma nova biblioteca de UI ou styling, o agente deve interromper a implementação e registrar uma decisão arquitetural.

## Relação com o desafio

A decisão atende à necessidade de destacar visualmente os problemas encontrados na transcrição, mantendo a mesma semântica visual utilizada no produto e nas planilhas.

As regras de destaque não devem ser implementadas como conhecimento isolado de cada componente. Elas devem ser derivadas das regras de domínio e representadas visualmente pelo Design System.

## Resultado esperado

A aplicação deve possuir uma linguagem visual consistente, com componentes e tokens centralizados, sem depender de múltiplas soluções de estilização.
