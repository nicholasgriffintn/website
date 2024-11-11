export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  content: string;
  role: ChatRole;
  timestamp?: number;
  model?: string;
  tool_calls?: {
    arguments: {
      [key: string]: string;
    };
    name: string;
  }[];
  logId?: string;
}

export interface ChatKey {
  id: string;
  title: string;
  name?: string;
}

export type ChatList = ChatKey[];

export interface ChatModel {
  id: string;
  name: string;
}
