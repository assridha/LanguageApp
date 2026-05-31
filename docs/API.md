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
