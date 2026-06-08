# Board Game Rulebook Search

An MVP search engine for board game rulebooks with per-game rules chat, Supabase/PostgreSQL storage, pgvector-ready embeddings, and a graph RAG-ready database schema.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase/PostgreSQL
- pgvector
- OpenAI API integration placeholder

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase and OpenAI values.

```bash
cp .env.example .env.local
```

## MVP Features

- Korean board game catalog UI
- Fixed tag filtering with multi-tag AND matching
- Board game detail pages
- Per-game rules chatbot placeholder
- Admin game/rulebook add request flow
- Supabase schema for rulebooks, chunks, embeddings, citations, graph nodes, and graph edges

## Current Games

- 아크 노바
- 윙스팬
- 브라스: 버밍엄
- 캐스캐디아
- 도미니언
- 티켓 투 라이드
- 티츄

## Database

Run the SQL in `supabase/migrations/001_initial_schema.sql` from the Supabase SQL editor or Supabase CLI.

Admin game add requests are written to `admin_game_requests` when Supabase admin environment variables are configured. Without Supabase credentials, the MVP stores requests locally in `data/game-requests.json` so the admin flow can still be tested.

## Authentication

Authentication is intentionally not implemented yet. The admin page is public in this MVP scaffold and should be protected before deployment.
