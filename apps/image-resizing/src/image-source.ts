const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];
const ALLOWED_HOSTNAME = "ng-blog.s3rve.co.uk";
const BASE_URL = `https://${ALLOWED_HOSTNAME}`;
const ANIMATION_PRECHECK_EXTENSIONS = ["gif", "webp"];

export function resolveImageURL(imageURLFromParams: string): string {
  return imageURLFromParams.startsWith("http")
    ? imageURLFromParams
    : `${BASE_URL}${imageURLFromParams}`;
}

export function validateImageURL(imageURL: string): Response | null {
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

export function shouldPrecheckForAnimation(imageURL: string): boolean {
  const { pathname } = new URL(imageURL);
  const extension = pathname.toLowerCase().split(".").pop();

  return extension ? ANIMATION_PRECHECK_EXTENSIONS.includes(extension) : false;
}

export async function getOriginalImageResponse(
  imageURL: string,
  request: Request,
): Promise<Response> {
  return fetch(
    new Request(imageURL, {
      headers: request.headers,
    }),
  );
}
