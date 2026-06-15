# Nicholas Griffin - Web

Main web application for `nicholasgriffin.dev`.

## Local development

Install from repo root:

```bash
pnpm install
```

Run in app dev mode (production service endpoints):

```bash
pnpm --filter web dev
```

This sets:

- `BLOG_API_BASE_URL=http://127.0.0.1:8787`
- `VITE_CONTACT_API_URL=http://127.0.0.1:8784`
- `VITE_IMAGE_SERVICE_URL=http://127.0.0.1:8783`

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
- `MUSIC_WIDGET_PROVIDER` (`apple-music` or `lastfm`; defaults to `apple-music`)
- `APPLE_MUSIC_USER_TOKEN`
- `VITE_EMAIL_TURNSTILE_SITE_KEY`

If a token is missing, only related widgets/endpoints fail or return empty data; core pages still run.

### Regenerating a musickit token

Rendering the widget for Apple Music on the homepage requires a Musickit token, which expire every 6 months, it's a bit annoying.

I wrote about it in my post here: https://nicholasgriffin.dev/blog/building-a-recently-played-widget-with-apple-music

To refresh the user token:

- Start the local server and load `http://localhost:5173/apple-music/auth`, click the Authorise button and complete the Apple Music sign-in flow.
- Copy the printed `USER TOKEN` into `APPLE_MUSIC_USER_TOKEN`.

Original write-up: https://nicholasgriffin.dev/blog/building-a-recently-played-widget-with-apple-music

## Deploy

```bash
pnpm deploy
```
