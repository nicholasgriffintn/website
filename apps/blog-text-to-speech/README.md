# Nicholas Griffin - Text to Speech

This app provides automated speech synthesis for blog posts on my website. You can find out more about it [here](https://nicholasgriffin.dev/blog/synthesizing-blog-posts).

This app:

- Consumes message from a Cloudflare Workers Queue.
- The queue payload will contain a key that corresponds to a markdown file in an R2 bucket.
- The markdown file will be read and parsed to extract the content and frontmatter.
- The content will be formatted into plain text and then sent directly to the selected speech provider SDK ([ElevenLabs](https://elevenlabs.io) or [Cartesia](https://cartesia.ai)).
- The generated audio will be uploaded to R2 and the corresponding D1 record will be updated with the audio URL.

Cloudflare Worker that turns blog post markdown files into MP3 audio and stores the output in R2.

## Local development

From the repo root:

```bash
pnpm install
```

Set local secrets in `apps/blog-text-to-speech/.dev.vars`:

```dotenv
# Cartesia
CARTESIA_API_KEY=your_cartesia_api_key
CARTESIA_VOICE_ID=your_cartesia_voice_id
# Optional
# CARTESIA_MODEL_ID=sonic-2

# ElevenLabs
# ELEVENLABS_API_KEY=your_elevenlabs_api_key
# ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
# Optional
# ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

Provider and speech formatting controls are set as code constants in:

- `src/index.ts` (`SPEECH_PROVIDER`, `CARTESIA_PARAGRAPH_BREAK_MS`)
- `src/services/speech.ts` (`DEFAULT_CARTESIA_SPEED`, `DEFAULT_CARTESIA_VOLUME`, `DEFAULT_ELEVENLABS_SPEED`)

For ElevenLabs models:

- non-v3 models keep `<break>` and `<phoneme>` tags in output formatting
- v3 models convert `<break>` tags to punctuation pauses (`...`) since v3 does not support SSML break tags

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
