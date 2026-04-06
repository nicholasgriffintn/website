export interface QueueMessage {
  account: string;
  action: string;
  bucket: string;
  object: {
    key: string;
    size: number;
    eTag: string;
  };
  eventTime: string;
  copySource: {
    bucket: string;
    object: string;
  };
}

export interface WorkerEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  CARTESIA_API_KEY?: string;
  CARTESIA_VOICE_ID?: string;
  CARTESIA_MODEL_ID?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  ELEVENLABS_MODEL_ID?: string;
}
