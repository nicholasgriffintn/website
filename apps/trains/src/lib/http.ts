export type ApiResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export function json(statusCode: number, payload: unknown): ApiResponse {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(payload) };
}

export function empty(statusCode: number): ApiResponse {
  return { statusCode, headers: jsonHeaders, body: "" };
}

export function badRequest(message: string): ApiResponse {
  return json(400, { error: message });
}

export function notFound(message = "Not found"): ApiResponse {
  return json(404, { error: message });
}
