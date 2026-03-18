import { redirect } from "react-router";

export function loader() {
  return redirect("/apps/anyone-can-draw", 301);
}
