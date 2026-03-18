import { redirect } from "react-router";

export function loader() {
  return redirect("/ai/benchmarks", 301);
}
