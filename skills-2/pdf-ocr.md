# Skill: PDF + OCR

## Objetivo

Ler PDFs textuais e escaneados sem inventar informação.

## Pipeline

```text
PDF
 ↓
validate magic bytes
 ↓
try text extraction
 ↓
if usable → parser
if empty/insufficient → OCR
 ↓
normalize cautiously
 ↓
domain parser
 ↓
domain validation
```

## Regra de incerteza

Se OCR ou parser não puder determinar um caractere:

```text
?
```

Nunca substituir por um palpite.

## Separar adapters

Interface conceitual:

```ts
interface PdfTextExtractor {
  extract(input: PdfInput): Promise<ExtractedPage[]>
}

interface OcrEngine {
  recognize(page: RenderedPage): Promise<OcrResult>
}
```

O domínio não deve importar Tesseract, SDK de nuvem ou biblioteca PDF.

## Falhas

Tratar explicitamente:

- PDF corrompido;
- PDF sem páginas;
- OCR timeout;
- OCR indisponível;
- página vazia;
- layout desconhecido;
- resultado parcial.

## Layout desconhecido

Se não houver evidência suficiente para uma leitura segura:

- retornar erro de processamento ou campos incertos;
- nunca fabricar estrutura.

## Fixtures

Não depender de serviço externo de OCR nos testes unitários. Use fake adapter determinístico.
