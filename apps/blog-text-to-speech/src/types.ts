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
