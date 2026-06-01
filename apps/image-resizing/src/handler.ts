import { getAnimationPrecheckResponse } from "./animation-precheck";
import { getImageOptions } from "./image-options";
import { CORS_HEADERS, createImageResponse, hasImageResizeFailure } from "./image-responses";
import { getOriginalImageResponse, resolveImageURL, validateImageURL } from "./image-source";

export async function handleImageRequest(request: Request): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const imageURLFromParams = url.searchParams.get("image");

    if (!imageURLFromParams) {
      return new Response('Missing "image" value', { status: 400 });
    }

    const imageURL = resolveImageURL(imageURLFromParams);
    const validationError = validateImageURL(imageURL);
    if (validationError) return validationError;

    const options = getImageOptions(request, url.searchParams);
    const isJsonResponse = options.cf.image.format === "json";

    if (!isJsonResponse) {
      const precheckResponse = await getAnimationPrecheckResponse(imageURL, request);
      if (precheckResponse) return precheckResponse;
    }

    const imageRequest = new Request(imageURL, {
      headers: request.headers,
    });
    const response = await fetch(imageRequest, options);

    if (!isJsonResponse && (await hasImageResizeFailure(response))) {
      return createImageResponse(await getOriginalImageResponse(imageURL, request));
    }

    return createImageResponse(response);
  } catch (err) {
    console.error("Error processing image request:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
