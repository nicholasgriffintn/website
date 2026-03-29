import { QueueMessage } from "./types";
import { StorageService } from "./services/storage";
import { parseFrontmatter, formatContentForSpeech } from "./utils";
import { SpeechService } from "./services/speech";

type SpeechProvider = "cartesia" | "elevenlabs";

const SPEECH_PROVIDER: SpeechProvider = "elevenlabs";
const CARTESIA_PARAGRAPH_BREAK_MS = 700;
const ELEVENLABS_PARAGRAPH_BREAK_MS = 700;
const DEFAULT_ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

function isElevenLabsV3Model(modelId: string): boolean {
  return /\bv3\b/i.test(modelId) || modelId.toLowerCase().includes("eleven_v3");
}

function metadataFieldToString(metadata: Record<string, string | string[]>, key: string): string {
  const value = metadata[key];

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";
}

const handler: ExportedHandler<
  {
    DB: D1Database;
    BUCKET: R2Bucket;
    CARTESIA_API_KEY?: string;
    CARTESIA_VOICE_ID?: string;
    CARTESIA_MODEL_ID?: string;
    ELEVENLABS_API_KEY?: string;
    ELEVENLABS_VOICE_ID?: string;
    ELEVENLABS_MODEL_ID?: string;
  },
  QueueMessage
> = {
  async queue(
    batch: MessageBatch<QueueMessage>,
    env: {
      BUCKET: R2Bucket;
      DB: D1Database;
      CARTESIA_API_KEY?: string;
      CARTESIA_VOICE_ID?: string;
      CARTESIA_MODEL_ID?: string;
      ELEVENLABS_API_KEY?: string;
      ELEVENLABS_VOICE_ID?: string;
      ELEVENLABS_MODEL_ID?: string;
    },
  ): Promise<void> {
    if (batch.messages.length === 0) {
      return;
    }

    const provider = SPEECH_PROVIDER;
    const elevenLabsModelId = env.ELEVENLABS_MODEL_ID || DEFAULT_ELEVENLABS_MODEL_ID;
    const supportsElevenLabsBreakTags = !isElevenLabsV3Model(elevenLabsModelId);
    const formatterConfig = {
      cartesia: {
        supportsBreakTags: true,
        paragraphBreakMs: CARTESIA_PARAGRAPH_BREAK_MS,
      },
      elevenlabs: {
        supportsBreakTags: supportsElevenLabsBreakTags,
        paragraphBreakMs: ELEVENLABS_PARAGRAPH_BREAK_MS,
      },
    } as const;
    const storageService = new StorageService(env.BUCKET);
    const speechService = new SpeechService({
      provider,
      cartesiaApiKey: env.CARTESIA_API_KEY,
      cartesiaVoiceId: env.CARTESIA_VOICE_ID,
      cartesiaModelId: env.CARTESIA_MODEL_ID,
      elevenLabsApiKey: env.ELEVENLABS_API_KEY,
      elevenLabsVoiceId: env.ELEVENLABS_VOICE_ID,
      elevenLabsModelId,
    });

    const results = await Promise.allSettled(
      batch.messages.map(async (message) => {
        console.log(`Processing ${message.body.object.key}`);

        const paths = message.body.object.key.split("/");
        const slug = paths[paths.length - 1]?.replace(".md", "") || "";

        if (!slug) {
          console.log(`Invalid slug for ${message.body.object.key}`);
          return;
        }

        const findStmt = env.DB.prepare("SELECT * FROM document WHERE id = ?");
        const result = await findStmt.bind(slug).first();

        if (result?.draft === true || result?.archived === true) {
          console.log(`Document ${message.body.object.key} is a draft or archived`);
          return;
        }

        const content = await storageService.getObject(message.body.object.key);
        if (!content) {
          console.log(`Object ${message.body.object.key} not found`);
          return;
        }

        const { content: blogContent, metadata } = parseFrontmatter(content);
        const title = metadataFieldToString(metadata, "title");
        const description = metadataFieldToString(metadata, "description");
        const fullBlogContent = `# ${title}\n${description}\n${blogContent}`;
        const activeFormatterConfig = formatterConfig[provider];
        const formattedContent = formatContentForSpeech(fullBlogContent, {
          markupProfile: provider,
          supportsBreakTags: activeFormatterConfig.supportsBreakTags,
          paragraphBreakMs: activeFormatterConfig.paragraphBreakMs,
        });

        const audioKey = await speechService.uploadObject(formattedContent, storageService, slug);

        if (!audioKey) {
          console.log(`Failed to generate audio for ${message.body.object.key}`);
          return;
        }

        const updateStmt = env.DB.prepare("UPDATE document SET audio_url = ? WHERE id = ?");
        await updateStmt.bind(audioKey, slug).run();

        console.log(`Processed ${message.body.object.key}`);
      }),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to process message ${batch.messages[index].body.object.key}:`,
          result.reason,
        );
      }
    });

    console.log(`Completed processing ${batch.messages.length} messages`);
  },
};

export default handler;
