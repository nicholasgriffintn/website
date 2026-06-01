export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function createImageResponse(
  response: Response,
  body: BodyInit | null = response.body,
): Response {
  const contentType = response.headers.get("Content-Type");

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}

export async function hasImageResizeFailure(response: Response): Promise<boolean> {
  if (response.headers.get("Cf-Resized")?.includes("err=")) return true;
  if (response.ok) return false;

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("text/plain") && !contentType.includes("text/html")) return false;

  const body = await response.clone().text();

  return body.includes("Could not resize the image");
}
