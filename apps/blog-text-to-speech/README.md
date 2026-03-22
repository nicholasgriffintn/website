# Nicholas Griffin - Text to Speech

This app provides automated speech synthesis for blog posts on my website. You can find out more about it [here](https://nicholasgriffin.dev/blog/synthesizing-blog-posts).

This app:

- Consumes message from a Cloudflare Workers Queue.
- The queue payload will contain a key that corresponds to a markdown file in an R2 bucket.
- The markdown file will be read and parsed to extract the content and frontmatter.
- The content will be formatted into plain text and then passed onto the [Polychat](https://polychat.app) speech API to generate speech from the text using the selected ai service.
- The generated audio will be uploaded to R2 and the corresponding D1 record will be updated with the audio URL.

Cloudflare Worker that turns blog post markdown files into MP3 audio and stores the output in R2.

## Local development

From the repo root:

```bash
pnpm install
```

Set local secrets in `apps/blog-text-to-speech/.dev.vars`:

```dotenv
ASSISTANT_API_KEY=your_polychat_api_key
```

Start the worker with Wrangler:

```bash
pnpm --filter website-blog-text-to-speech dev
```

`pnpm dev` uses shared local state at `../../.wrangler/state`.

This worker is a queue consumer, so queue messages must be produced by another worker running in the same Wrangler `dev` session.

## Deploy

```bash
pnpm deploy
```
