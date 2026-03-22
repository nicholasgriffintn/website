# Nicholas Griffin's Website

This is the repo for my personal website.

## Apps

- `apps/web`: main site.
- `apps/blog-api`: blog content API + queue consumer.
- `apps/blog-text-to-speech`: queue consumer for MP3 generation.
- `apps/email`: contact form / inbound email worker.
- `apps/image-resizing`: image transformation worker.
- `apps/database`: D1 schema + migrations.

## Local connected development

All worker apps use the same persisted state at `.wrangler/state`.

```bash
pnpm install
pnpm db:migrate:local
pnpm dev:services
```

Run the site against local worker services:

```bash
pnpm --filter web dev:local
```

Or run both web + services together:

```bash
pnpm dev:connected
```
