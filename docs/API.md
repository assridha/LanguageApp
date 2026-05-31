# Agent API Guide

Base URL: `http://localhost:3000/api/v1`

OpenAPI spec: `GET /api/openapi.json`

## Authentication

When `AGENT_API_KEY` is set in the environment, include it on write requests from external clients:

```bash
-H "Authorization: Bearer $AGENT_API_KEY"
```

Same-origin browser requests and localhost are allowed without a token.

## Response format

```json
{ "ok": true, "data": {}, "meta": {} }
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

## Bulk import words

```bash
curl -X POST http://localhost:3000/api/v1/cards/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -d '{
    "cards": [
      { "dutchWord": "hond", "imageUrl": "https://example.com/hond.jpg" },
      { "dutchWord": "kat" }
    ],
    "options": { "skipDuplicates": true }
  }'
```

## Generate flashcards by theme

Picks novel Dutch words for a free-text theme (excluding words already in the deck), then creates flashcards with AI-generated definitions and examples.

```bash
curl -X POST http://localhost:3000/api/v1/cards/generate-by-theme \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -d '{
    "theme": "words spoken at supermarket",
    "count": 10
  }'
```

Request body:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | string | required | Topic or setting (2–200 chars), e.g. `school`, `health` |
| `count` | number | `10` | Number of new words to add (1–10) |

Response: same shape as bulk import (`created`, `skipped`, `failed`) plus `meta.theme`, `meta.requestedCount`, and `meta.selectedWords`.

Errors:

| Code | Status | When |
|------|--------|------|
| `INSUFFICIENT_THEME_WORDS` | 422 | Fewer than `count` novel words found after retries |
| `VALIDATION_ERROR` | 400 | Invalid theme or count |
| `UNKNOWN_WORD` | 422 | A generated word failed validation during card creation |

## Create one card with manual content

```bash
curl -X POST http://localhost:3000/api/v1/cards \
  -H "Content-Type: application/json" \
  -d '{
    "dutchWord": "fiets",
    "imageUrl": "https://example.com/fiets.jpg",
    "generate": false,
    "englishDefinition": "bicycle",
    "exampleSentences": [
      { "dutch": "Ik rijd op mijn fiets.", "english": "I ride my bicycle." }
    ]
  }'
```

## List and search

```bash
curl "http://localhost:3000/api/v1/cards?search=hond&limit=20"
curl "http://localhost:3000/api/v1/cards/focus?limit=10"
```

## Update and delete

```bash
curl -X PATCH http://localhost:3000/api/v1/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{ "userPinned": true }'

curl -X DELETE http://localhost:3000/api/v1/cards/CARD_ID
```

## Bulk delete

```bash
curl -X DELETE http://localhost:3000/api/v1/cards/bulk \
  -H "Content-Type: application/json" \
  -d '{ "dutchWords": ["hond", "kat"] }'
```

## Start a test session

```bash
curl -X POST http://localhost:3000/api/v1/test/session \
  -H "Content-Type: application/json" \
  -d '{ "mode": "focus", "count": 10, "types": ["definitionToWord", "wordToDefinition"] }'
```

## Import script

```bash
npx tsx scripts/import-words.ts words.txt
```

Each line in `words.txt` should contain one Dutch word.
