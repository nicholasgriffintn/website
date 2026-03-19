import { StorageService } from "./storage";

const POLYCHAT_API_URL = "https://api.polychat.app/audio/speech";

interface PolychatSpeechResponse {
  response: {
    status: "success" | "error";
    name: string;
    content: string;
    data: {
      audioUrl?: string;
    } | null;
  };
}

export class SpeechService {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async uploadObject(
    content: string,
    storageService: StorageService,
    slug: string,
  ): Promise<string> {
    const input = content;

    const response = await fetch(POLYCHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": "nicholasgriffin-blog/1.0",
      },
      body: JSON.stringify({ input, provider: "cartesia" }),
    });

    if (!response.ok) {
      throw new Error(`Polychat API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PolychatSpeechResponse;

    if (data.response.status !== "success") {
      throw new Error(`Polychat speech generation failed: ${data.response.content}`);
    }

    const audioUrl = data.response.data?.audioUrl;
    if (!audioUrl) {
      throw new Error("No audio URL in Polychat response");
    }

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio from Polychat: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioKey = `audio/${slug}.mp3`;

    await storageService.uploadObject(audioKey, new Uint8Array(audioBuffer));

    return audioKey;
  }
}
