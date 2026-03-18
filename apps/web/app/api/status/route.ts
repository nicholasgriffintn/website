export const runtime = "edge";

import pkg from "@/package.json";

export async function GET() {
  return Response.json({
    status: "OK",
    version: pkg.version,
  });
}
