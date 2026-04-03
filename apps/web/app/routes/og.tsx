import type { LoaderFunctionArgs } from "react-router";

import { createOgImageSvg } from "@/lib/og-image";
import { SITE_NAME } from "@/lib/seo";

export function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const title = requestUrl.searchParams.get("title")?.trim() || SITE_NAME;
  const svg = createOgImageSvg(title);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Disposition": 'inline; filename="og-image.svg"',
    },
  });
}
