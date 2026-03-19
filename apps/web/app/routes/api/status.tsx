import pkg from "@/package.json";

export function loader() {
  return Response.json({ status: "OK", version: pkg.version });
}
