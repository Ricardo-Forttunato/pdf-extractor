# Skill: Docker + CI

## Docker

Obrigatório:

- `Dockerfile`;
- `docker-compose.yml`;
- `docker compose up --build`.

## Build

Preferir multi-stage build:

```text
deps → build → runtime
```

Runtime mínimo.

## Healthcheck

O container deve verificar:

```text
GET /healthz
```

## Environment

Documentar `.env.example`.

Nunca copiar `.env` para a imagem.

## CI

Pipeline mínima:

```text
install
→ lint
→ typecheck
→ unit/integration
→ build
→ E2E
```

Se E2E exigir serviços, iniciar com Docker ou service container.

## Reprodutibilidade

Versões lockadas.

CI e local devem usar os mesmos comandos do `package.json`.

## Falha rápida

Lint/typecheck devem acontecer antes dos E2E.
