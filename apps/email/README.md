# Nicholas Griffin - Email Worker

This worker handles contact-form email for `nicholasgriffin.dev` and forwards inbound routed email.

This:

- Exposes an HTTP endpoint (`fetch`) for contact form submissions.
- Accepts `multipart/form-data` with `from`, `subject`, `body`, and `cf-turnstile-response`.
- Validates the Turnstile token using `TURNSTILE_SECRET_KEY`.
- Sends the message using Cloudflare Email Workers (`EMAIL` binding) to `FORWARD_TO`.
- Stores sent message data in R2 (`R2_BUCKET`) as `email.json`.
- Handles inbound email events (`email`), parses message + attachments, stores them in R2, then forwards to `FORWARD_TO`.
- Supports a simple sender block list in `src/index.ts` (`blockList`).

## Local development

From the repo root:

```bash
pnpm install
cd apps/email
```

Create `apps/email/.dev.vars`:

```dotenv
FORWARD_TO=you@example.com
TURNSTILE_SECRET_KEY=your-turnstile-secret
# Optional: comma-separated extra CORS origins to allow (defaults are always included)
# ALLOWED_ORIGINS=https://nicholasgriffin.dev,https://preview.nicholasgriffin.dev,http://localhost:5173,http://127.0.0.1:5173
```

Start the worker locally:

```bash
pnpm dev
```

This runs `wrangler dev` on `http://127.0.0.1:8784` with shared state at `../../.wrangler/state`.

Example `curl` request:

```bash
curl -X POST http://127.0.0.1:8784 \
  -F "from=test@example.com" \
  -F "subject=Hello" \
  -F "body=Test message" \
  -F "cf-turnstile-response=<valid-token>"
```

## Deploy

```bash
pnpm deploy
```
