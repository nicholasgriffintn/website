export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://nicholasgriffin.dev",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const JSON_HEADERS = {
  "Content-Type": "application/json",
  ...CORS_HEADERS,
};

export const BLOG_RESPONSE_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=1800, stale-while-revalidate=86400",
} as const;

export const ASSISTANT_API_URL = "https://polychat.app";
