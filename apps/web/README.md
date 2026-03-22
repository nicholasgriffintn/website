# Nicholas Griffin - Web

Main web application for `nicholasgriffin.dev`.

## Local development

Install from repo root:

```bash
pnpm install
```

Run in app dev mode:

```bash
pnpm --filter web dev
```

Run locally with Wrangler (Worker runtime):

```bash
pnpm --filter web build
pnpm --filter web start
```

`pnpm --filter web start` runs `wrangler dev` using the built Worker output.

## Environment variables

Set these in `apps/web/.env` for local development:

- `GITHUB_TOKEN`
- `LAST_FM_TOKEN`
- `APPLE_MUSIC_USER_TOKEN`
- `APPLE_MUSIC_MUSICKIT_TOKEN`
- `VITE_EMAIL_TURNSTILE_SITE_KEY`

If a token is missing, only related widgets/endpoints fail or return empty data; core pages still run.

## Deploy

```bash
pnpm deploy
```
