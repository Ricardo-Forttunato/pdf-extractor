# SKILLS.md — Catálogo de Skills do Agente

Use as skills como contratos operacionais. Uma skill não é um tutorial: é um conjunto de regras, entradas, saídas, verificações e anti-padrões.

## Skills

1. `spec-driven.md` — transformar requisito em especificação e critérios de aceite.
2. `looping-engineering.md` — ciclo Observe → Specify → Plan → Implement → Verify → Review → Fix.
3. `harness-engineering.md` — construir guardrails, scripts, fixtures e quality gates.
4. `testing-quality.md` — estratégia de testes, cobertura útil, mutation-minded testing e regressões.
5. `contract-testing.md` — garantir o contrato HTTP literal.
6. `domain-transcription.md` — invariantes de cartão e holerite.
7. `pdf-ocr.md` — extração, OCR, incerteza e falhas.
8. `mui-ui.md` — UI MUI.
9. `playwright-e2e.md` — E2E determinístico e orientado a comportamento.
10. `export-spreadsheets.md` — XLSX/CSV/JSON e regras visuais.
11. `security-privacy.md` — upload público, PII, retenção e observabilidade.
12. `docker-ci.md` — Docker Compose, CI e reprodução local.

## Ordem recomendada

Para uma feature nova:

```text
spec-driven
→ domain-transcription / pdf-ocr
→ harness-engineering
→ testing-quality
→ implementation skill
→ contract-testing
→ playwright-e2e
→ security-privacy
```

Para correção de bug:

```text
reproduce
→ write regression test
→ fix
→ verify
→ run full gates
```
