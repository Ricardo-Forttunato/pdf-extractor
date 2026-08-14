<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Modified principles:
  - I. Fidelity Over Apparent Completeness → I. Architecture and Approved Stack
  - II. Raw Data Is Auditable → II. Immutable HTTP and Output Contracts
  - III. One End-to-End Pipeline, Specialized Extraction → III. Data Fidelity Is Absolute
  - IV. Reviewability Is a Product Requirement → IV. Risk-Based Testing
  - V. Contract, Safety, and Operability Are Non-Negotiable → V. Security and Privacy by Default
- Added sections: Mandatory Technology and Contract Constraints; Validation and Delivery Gates
- Removed sections: none
- Follow-up TODOs: none
-->
# Quick Filler Constitution

## Core Principles

### I. Architecture and Approved Stack
Quick Filler MUST use Next.js with the App Router and TypeScript with strict typing. Its user
interface MUST use Material UI (MUI). Jest with React Testing Library (RTL) is the standard for
unit and component/integration tests, Playwright is the standard for end-to-end tests, and Docker
is mandatory for reproducible execution. Changes that replace, bypass, or introduce competing
technology for these responsibilities require a documented constitutional amendment. A uniform
stack keeps the application maintainable, testable, and reproducible.

### II. Immutable HTTP and Output Contracts
The HTTP API, including `/api/transcricoes` and `/healthz`, is an external immutable contract.
Every documented method, path, status code, request shape, response shape, and error behavior MUST
be implemented literally. The JSON schemas for Cartão de Ponto and Holerite outputs are equally
immutable. No code, test fixture, UI convenience, or undocumented fallback may add, remove,
rename, reinterpret, or silently coerce contract fields. Any divergence is a release-blocking
defect because consumer interoperability has zero tolerance for contract variation.

### III. Data Fidelity Is Absolute
The system MUST NEVER invent a value. Each unreadable character or value MUST be represented by
`?`, preserving uncertainty instead of guessing. Parsers and editors MUST reject impossible dates,
times, and months; they MUST NOT normalize a value such as `38/07` into a plausible date. Holerite
monetary values MUST be Brazilian-real formatted strings, such as `2.389,77`; they MUST NOT be
represented as numbers, floating-point values, or another currency format. These rules protect
workers from financially and legally material transcription errors.

### IV. Risk-Based Testing
Quality takes precedence over test count. Tests MUST first validate critical business rules:
document parsers, data-fidelity and validation rules, immutable output schemas, and spreadsheet
generators. The application MUST maintain at least one Playwright end-to-end test for the critical
flow from PDF upload through processing, review/correction, and spreadsheet download. Superficial
UI tests that do not exercise a meaningful user or business outcome MUST NOT substitute for these
tests. This concentrates verification where defects have the greatest impact.

### V. Security and Privacy by Default
Application logs MUST NOT contain PII or sensitive document content, including employee names,
CPF numbers, salaries, financial values, work hours, OCR output, PDF contents, or original file
names that can identify a person. Logs MUST use opaque identifiers where correlation is needed.
PDF uploads MUST enforce a strict, configured maximum size before processing, and validation MUST
reject files that exceed it. These controls minimize sensitive-data exposure and prevent resource
exhaustion on a public upload endpoint.

## Mandatory Technology and Contract Constraints

The implementation MUST preserve a clear separation between application/domain behavior and
Next.js route or UI concerns. MUI components are the established design-system primitives, and
TypeScript types and executable validation schemas MUST protect API and document boundaries.

The Cartão de Ponto and Holerite models MUST preserve the order and raw representations required
by their output schemas. Exports MUST be generated from validated, user-corrected transcription
data and MUST preserve the contract's required field semantics. Docker configuration MUST make the
application runnable reproducibly, and `/healthz` MUST report the service's operational status.

## Validation and Delivery Gates

Before merging or delivering a change, the team MUST verify the relevant TypeScript checks, Jest
and RTL tests, contract tests when a boundary is affected, and the required Playwright critical
flow when that flow is affected. Parser and spreadsheet-generator changes MUST include focused
regression coverage for the modified business rule. Contract-affecting changes MUST prove that the
documented endpoint and JSON schema remain exact.

Reviews MUST explicitly check for fabricated values, invalid dates, non-BRL monetary output,
contract drift, PII in logging, and absent or bypassed PDF upload limits. A passing build or a
large number of shallow UI tests is not evidence of constitutional compliance.

## Governance

This constitution supersedes conflicting implementation preferences, plans, and task artifacts.
Every specification, plan, task list, review, and release check MUST demonstrate compliance with
these principles. Exceptions require a documented, time-bounded rationale and MUST NOT weaken the
immutable contracts, data-fidelity rules, privacy rules, or upload-size limit.

Amendments require a documented rationale, impact assessment, and version increment. A MAJOR
version removes or incompatibly redefines a principle; a MINOR version adds a principle or
materially expands mandatory guidance; a PATCH version only clarifies wording without changing
governance. Compliance MUST be reviewed before merge and before delivery.

**Version**: 2.0.0 | **Ratified**: 2026-08-13 | **Last Amended**: 2026-08-14
