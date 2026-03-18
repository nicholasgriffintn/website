import { redirect } from "react-router";

export function loader() {
  return redirect("/ai/metrics", 301);
}
