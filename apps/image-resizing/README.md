# Image Resizing Worker

Cloudflare Worker used by the website to resize and reformat images at request time.

This:

- Accepts requests with an `image` query parameter.
- Fetches the source image from `ng-blog.s3rve.co.uk`.
- Applies Cloudflare image transforms from query params:
  - `width`
  - `height`
  - `fit`
  - `quality`
- Chooses output format from the request `Accept` header (`avif` first, then `webp`), or `format=json` when explicitly requested.
- Returns long-lived cache headers (`Cache-Control: public, max-age=31536000`).

## Validation rules

- Only images from `ng-blog.s3rve.co.uk` are allowed.
- Only these file extensions are allowed:
  - `jpg`
  - `jpeg`
  - `png`
  - `gif`
  - `webp`
  - `avif`
  - `svg`
- If `image` is a path (not a full URL), the worker prepends `https://ng-blog.s3rve.co.uk`.

## Example request

```text
GET /?image=/assets/photo.jpg&width=800&height=450&fit=cover&quality=80
```

## Run locally with Wrangler

From this directory:

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs:

```bash
wrangler dev --persist-to ../../.wrangler/state
```

The worker runs on `http://localhost:8783` (set in `wrangler.json`).
It uses shared local state at `../../.wrangler/state`.

Example local call:

```bash
curl "http://localhost:8783/?image=/assets/photo.jpg&width=800&fit=cover"
```

From the repo root, you can also run:

```bash
pnpm --filter website-image-resizing dev
```

To run this worker together with other local services:

```bash
pnpm dev:services
```

## Deploy

```bash
pnpm deploy
```
