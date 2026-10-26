# EdgePro Trading Journal

EdgePro is a trading journal built with Next.js. Trader Notes is a feature inside the authenticated dashboard, not a second application. It brings the workspace and document workflows from the Microsoft Loop clone into EdgePro's shared navigation, authentication, APIs, and database.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app source is under `src/`.

Before first use, set the existing database connection in `.env.local` and run `npm run db:migrate:notes`. This applies only the Trader Notes tables and indexes, using `DATABASE_URL_UNPOOLED` when available. The full `npm run db:migrate` command also runs the app's broader trading schema upgrades.

## Trader Notes module

Open **Trader Notes** from the dashboard navigation at `/trader-notes`. Its UI is in `src/components/trader-notes/`, its authenticated API is under `src/app/api/notes/`, and persistence is in `src/lib/db/notes.ts` with tables declared in `src/lib/db/schema.sql`.

The module includes workspaces, up to ten documents per workspace, document search and grid/list views, Markdown editing with autosave, comments, trading templates, image attachments, workspace and document styling, duplication, and public read-only sharing. It uses EdgePro authentication and Neon persistence. The legacy `microsoft-loop-clone/` checkout is a reference; EdgePro does not route into or launch that app.
