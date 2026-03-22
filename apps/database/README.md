# Nicholas Griffin - Database

This is a simple app for managing my database, mostly it's a centralised place where I can keep the schema.

This:

- Defines the Drizzle schema in `src/schema.ts`.
- Generates and stores SQL migrations in `migrations/`.
- Applies D1 migrations for local, preview, and production environments.
- Exports schema/types for other packages via `src/index.ts`.

Current core tables:

- `user`
- `oauth_account`
- `session`
- `document`

## Local development

From the repo root:

```bash
pnpm install
cd apps/database
```

Apply migrations to local D1 state:

```bash
pnpm db:migrate:local
```

Run ad-hoc SQL against local D1:

```bash
pnpm exec wrangler d1 execute personal-web --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Open Drizzle Studio against the local database:

```bash
pnpm db:studio:local
```

## Schema and migration workflow

After changing `src/schema.ts`, generate a migration:

```bash
pnpm generate
```

Apply generated migrations locally:

```bash
pnpm db:migrate:local
```

## Remote migration commands

Preview:

```bash
pnpm db:migrate:preview
```

Production:

```bash
pnpm db:migrate:prod
```
