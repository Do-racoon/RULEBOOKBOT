# AGENTS.md

## Project Mission

Build a clean, extensible MVP for searching board game rulebooks and answering rules questions per game.

## Architecture Priorities

- Use Next.js App Router with TypeScript.
- Keep UI components small, typed, and reusable.
- Keep data access behind `src/lib` helpers so Supabase, retrieval, and OpenAI code can evolve independently.
- Do not add authentication until explicitly requested.
- Treat uploads, OCR, embeddings, and graph extraction as pipeline stages that can be implemented incrementally.

## Coding Guidelines

- Prefer server components for read-only pages.
- Use client components only for interactive UI such as search filters, chat, and upload forms.
- Keep placeholders honest: mark incomplete integrations clearly, but design their interfaces as production-shaped seams.
- Add SQL migrations under `supabase/migrations`.
- Keep environment variables documented in `.env.example`.
