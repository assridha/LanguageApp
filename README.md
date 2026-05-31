# Dutch Flashcards

English → Dutch language learning app with AI-generated flashcards, practice mode, and adaptive testing.

## Features

- Add Dutch words — auto-generates English definitions and example sentences, with optional user-provided image URL
- Practice mode with flip cards
- Adaptive test mode prioritizing focus words (weak, new, stale, pinned)
- Agent-friendly REST API with bulk import
- Responsive UI for desktop and mobile

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and allow network access
3. Copy the connection string

### 3. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:

- `MONGODB_URI` — Atlas connection string
- `OPENAI_API_KEY` — for generating definitions and examples

Optional:

- `AGENT_API_KEY` — protects API writes from external clients when deployed

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

See [docs/API.md](docs/API.md) for agent usage and curl examples.

OpenAPI spec: `GET /api/openapi.json`

### Bulk import example

```bash
curl -X POST http://localhost:3000/api/v1/cards/bulk \
  -H "Content-Type: application/json" \
  -d '{"words":["hond","kat","huis"]}'
```

### Import from file

```bash
npx tsx scripts/import-words.ts words.txt
```

### Backfill de/het and gender for existing cards

```bash
npm run backfill-gender
```

Use `--force` to refresh metadata on all cards:

```bash
npx tsx scripts/backfill-gender.ts --force
```

Or via API:

```bash
curl -X POST http://localhost:3000/api/v1/cards/backfill-gender \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Backfill part of speech for existing cards

```bash
npm run backfill-part-of-speech
```

Use `--force` to refresh metadata on all cards:

```bash
npx tsx scripts/backfill-part-of-speech.ts --force
```

Or via API:

```bash
curl -X POST http://localhost:3000/api/v1/cards/backfill-part-of-speech \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Test modes

| Mode | Description |
|------|-------------|
| Focus (default) | 70% high-priority words, 30% review |
| Weak only | Low mastery or recently missed |
| New only | Never tested |
| Full | Random from entire deck |

## Tech stack

- Next.js 15+ (App Router)
- MongoDB Atlas + Mongoose
- OpenAI GPT-4o-mini
- Tailwind CSS
