import { getProjects } from "@/lib/data/projects";

export async function loader() {
  const data = await getProjects();
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=180000" },
  });
}
