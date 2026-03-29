import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import Cartesia from "@cartesia/cartesia-js";

import { StorageService } from "./storage";

type SpeechProvider = "cartesia" | "elevenlabs";

interface SpeechServiceConfig {
  provider: SpeechProvider;
  cartesiaApiKey?: string;
  cartesiaVoiceId?: string;
  cartesiaModelId?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  elevenLabsModelId?: string;
}

const DEFAULT_CARTESIA_MODEL_ID = "sonic-2";
const DEFAULT_ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_CARTESIA_SPEED = 1.0;
const DEFAULT_CARTESIA_VOLUME = 1.0;
const DEFAULT_ELEVENLABS_SPEED = 1.0;
const DEFAULT_ELEVENLABS_APPLY_TEXT_NORMALIZATION = "auto" as const;

export class SpeechService {
  private readonly provider: SpeechProvider;
  private readonly cartesiaApiKey?: string;
  private readonly cartesiaVoiceId?: string;
  private readonly cartesiaModelId: string;
  private readonly elevenLabsApiKey?: string;
  private readonly elevenLabsVoiceId?: string;
  private readonly elevenLabsModelId: string;

  constructor(config: SpeechServiceConfig) {
    this.provider = config.provider;
    this.cartesiaApiKey = config.cartesiaApiKey;
    this.cartesiaVoiceId = config.cartesiaVoiceId;
    this.cartesiaModelId = config.cartesiaModelId || DEFAULT_CARTESIA_MODEL_ID;
    this.elevenLabsApiKey = config.elevenLabsApiKey;
    this.elevenLabsVoiceId = config.elevenLabsVoiceId;
    this.elevenLabsModelId = config.elevenLabsModelId || DEFAULT_ELEVENLABS_MODEL_ID;
  }

  async uploadObject(
    content: string,
    storageService: StorageService,
    slug: string,
  ): Promise<string> {
    const input = content;

    if (!input) {
      throw new Error("No content provided for speech generation");
    }

    const audioBuffer = await this.generateAudio(input);
    const audioKey = `audio/${slug}.mp3`;

    await storageService.uploadObject(audioKey, audioBuffer);

    return audioKey;
  }

  private async generateAudio(input: string): Promise<Uint8Array> {
    if (this.provider === "elevenlabs") {
      return this.generateElevenLabsAudio(input);
    }

    return this.generateCartesiaAudio(input);
  }

  private async generateElevenLabsAudio(input: string): Promise<Uint8Array> {
    if (!this.elevenLabsApiKey) {
      throw new Error("Missing ELEVENLABS_API_KEY for ElevenLabs TTS provider");
    }

    if (!this.elevenLabsVoiceId) {
      throw new Error("Missing ELEVENLABS_VOICE_ID for ElevenLabs TTS provider");
    }

    const client = new ElevenLabsClient({ apiKey: this.elevenLabsApiKey });
    const stream = await client.textToSpeech.convert(this.elevenLabsVoiceId, {
      text: input,
      modelId: this.elevenLabsModelId,
      outputFormat: "mp3_44100_128",
      applyTextNormalization: DEFAULT_ELEVENLABS_APPLY_TEXT_NORMALIZATION,
      voiceSettings: {
        speed: DEFAULT_ELEVENLABS_SPEED,
      },
    });

    return this.readReadableStream(stream);
  }

  private async generateCartesiaAudio(input: string): Promise<Uint8Array> {
    if (!this.cartesiaApiKey) {
      throw new Error("Missing CARTESIA_API_KEY for Cartesia TTS provider");
    }

    if (!this.cartesiaVoiceId) {
      throw new Error("Missing CARTESIA_VOICE_ID for Cartesia TTS provider");
    }

    const client = new Cartesia({
      apiKey: this.cartesiaApiKey,
    });

    const response = await client.tts.generate({
      model_id: this.cartesiaModelId,
      transcript: input,
      voice: {
        mode: "id",
        id: this.cartesiaVoiceId,
      },
      output_format: {
        container: "mp3",
        sample_rate: 44100,
        bit_rate: 128000,
      },
      generation_config: {
        speed: DEFAULT_CARTESIA_SPEED,
        volume: DEFAULT_CARTESIA_VOLUME,
      },
    });

    return new Uint8Array(await response.arrayBuffer());
  }

  private async readReadableStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value instanceof Uint8Array ? value : new Uint8Array(value));
      }
    }

    const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }
}
