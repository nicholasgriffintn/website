import { withSentry } from "@sentry/cloudflare";

import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "./constants";

interface ImageOptions {
  cf: {
    image: {
      format?: "json" | "avif" | "webp";
      fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
      width?: number;
      height?: number;
      quality?: number;
      [key: string]: any;
    };
  };
}

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];
const ALLOWED_HOSTNAME = "ng-blog.s3rve.co.uk";
const BASE_URL = `https://${ALLOWED_HOSTNAME}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function getImageOptions(request: Request, searchParams: URLSearchParams): ImageOptions {
  const options: ImageOptions = { cf: { image: {} } };

  if (searchParams.get("format") === "json") {
    options.cf.image.format = "json";
    return options;
  }

  const accept = request.headers.get("Accept");
  if (accept?.includes("image/avif")) {
    options.cf.image.format = "avif";
  } else if (accept?.includes("image/webp")) {
    options.cf.image.format = "webp";
  }

  ["fit", "width", "height", "quality"].forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      options.cf.image[param as keyof typeof options.cf.image] = value;
    }
  });

  return options;
}

function validateImageURL(imageURL: string): Response | null {
  try {
    const { hostname, pathname } = new URL(imageURL);

    if (!ALLOWED_EXTENSIONS.some((ext) => pathname.toLowerCase().endsWith(`.${ext}`))) {
      return new Response("Disallowed file extension", { status: 400 });
    }

    if (hostname !== ALLOWED_HOSTNAME) {
      return new Response(`Must use "${ALLOWED_HOSTNAME}" source images`, { status: 403 });
    }

    return null;
  } catch {
    return new Response('Invalid "image" value', { status: 400 });
  }
}

const handler = {
  async fetch(request: Request): Promise<Response> {
    try {
      if (request.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
      }

      const url = new URL(request.url);
      const imageURLFromParams = url.searchParams.get("image");

      if (!imageURLFromParams) {
        return new Response('Missing "image" value', { status: 400 });
      }

      const imageURL = imageURLFromParams.startsWith("http")
        ? imageURLFromParams
        : `${BASE_URL}${imageURLFromParams}`;

      const validationError = validateImageURL(imageURL);
      if (validationError) return validationError;

      const options = getImageOptions(request, url.searchParams);
      const imageRequest = new Request(imageURL, {
        headers: request.headers,
      });

      const response = await fetch(imageRequest, options);
      const contentType = response.headers.get("Content-Type");

      return new Response(response.body, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": contentType || "image/jpeg",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } catch (err) {
      console.error("Error processing image request:", err);
      return new Response("Internal server error", { status: 500 });
    }
  },
};

export default withSentry(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  }),
  handler,
);
