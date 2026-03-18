import { getProjects } from "@/lib/data/projects";

export const runtime = "edge";

export async function GET() {
  const data = await getProjects();

  return Response.json(data, {
    headers: {
      "Cache-Control": "s-maxage=180000",
    },
  });
}
