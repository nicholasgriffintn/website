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

If at least one message in a batch succeeds and `GITHUB_DEPLOY_TOKEN` + `GITHUB_REPO` are configured, it triggers the `production.yaml` workflow in this repo.

## Local development

From repo root:

```bash
pnpm install
cd apps/blog-api
```

Optional local secrets in `apps/blog-api/.dev.vars`:

```dotenv
GITHUB_DEPLOY_TOKEN=...
GITHUB_REPO=owner/repo
ASSISTANT_API_KEY=...
```

If your local D1 state does not have the `document` table yet, run:

```bash
pnpm wrangler d1 execute personal-web --local --file ../database/migrations/0000_chubby_nicolaos.sql
```

Start the worker:

```bash
pnpm dev
```

The API runs on `http://127.0.0.1:8785` (set in `wrangler.json`).

Quick checks:

```bash
curl "http://127.0.0.1:8785/content"
curl "http://127.0.0.1:8785/content/my-post-slug"
```

## Deploy

```bash
pnpm deploy
```
