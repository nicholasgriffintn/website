# Nicholas Griffin - Blog API

This provides an API interface for my blog posts to my website (`nicholasgriffin.dev`) alongside automated ingest from Obsidian. You can find out more about it [here](https://nicholasgriffin.dev/blog/creating-blog-posts-in-obsidian).

It:

- Serves blog posts from the `document` table in D1.
- Consumes queue messages for markdown files in R2, parses frontmatter + content, and upserts posts into D1.

## HTTP API

All routes are `GET` only.

- `/content` - list posts (newest first)
- `/content?drafts=true` - include drafts
- `/content?archived=true` - include archived posts
- `/content/:slug` - fetch a single post by slug

## Queue consumer

The worker has a queue consumer for `blog-update`.

Each message is expected to include an R2 object key for a markdown file. The worker:

- reads the file from the `blog` R2 bucket
- parses frontmatter and markdown body
- maps metadata to the `document` schema
- upserts the post into D1

If at least one message in a batch succeeds and `DEPLOY_HOOK_URL` is configured, it triggers a deployment via Cloudflare Workers Builds Deploy Hook.

## Local development

From repo root:

```bash
pnpm install
pnpm db:migrate:local
```

Optional local secrets in `apps/blog-api/.dev.vars`:

```dotenv
DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>
ASSISTANT_API_KEY=...
```

Start the worker with Wrangler:

```bash
pnpm dev
```

The API runs on `http://127.0.0.1:8787` (set in `wrangler.json`).

Quick checks:

```bash
curl "http://127.0.0.1:8787/content"
curl "http://127.0.0.1:8787/content/my-post-slug"
```

## Deploy

```bash
pnpm deploy
```
