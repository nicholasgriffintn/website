import type { Env } from "../types";

const defaultAllowedOrigins = [
  "https://nicholasgriffin.dev",
  "https://preview.nicholasgriffin.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function trimTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value.charCodeAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
}

function normaliseOrigin(origin: string): string | null {
  const trimmedOrigin = origin.trim();
  if (!trimmedOrigin) {
    return null;
  }

  try {
    return new URL(trimmedOrigin).origin;
  } catch {
    return trimTrailingSlashes(trimmedOrigin);
  }
}

function getAllowedOrigins(env: Env): string[] {
  const configuredOrigins =
    env.ALLOWED_ORIGINS?.split(",")
      .map((origin) => normaliseOrigin(origin))
      .filter((origin): origin is string => Boolean(origin)) || [];

  return [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
}

export function corsHeadersFor(request: Request, env: Env): Record<string, string> {
  const requestOrigin = request.headers.get("Origin");
  const normalisedRequestOrigin = requestOrigin ? normaliseOrigin(requestOrigin) : null;
  const allowOrigin =
    normalisedRequestOrigin && getAllowedOrigins(env).includes(normalisedRequestOrigin)
      ? normalisedRequestOrigin
      : null;

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return headers;
}

export function isOriginAllowed(request: Request, headers: Record<string, string>): boolean {
  return !request.headers.get("Origin") || Boolean(headers["Access-Control-Allow-Origin"]);
}
