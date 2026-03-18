export type ChatRole = "user" | "assistant";

export type ChatMode = "remote" | "local" | "prompt_coach";

export interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
}

export interface ChatMessage {
  id: string;
  name?: string;
  content?: string | { prompt: string; analysis: string };
  role: ChatRole;
  timestamp?: number;
  model?: string;
  tool_calls?: {
    arguments: {
      [key: string]: string;
    };
    name: string;
    function: {
      name: string;
    };
  }[];
  status?: string;
  logId?: string;
  data?: any;
  citations?: string[];
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
  isLocal?: boolean;
  description?: string;
  capabilities?: string[];
}
