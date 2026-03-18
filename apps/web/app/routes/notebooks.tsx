import type { MetaFunction } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";

export const meta: MetaFunction = () => [
  { title: "Jupyter Notebooks | Nicholas Griffin" },
  { name: "description", content: "A collection of jupyter notebooks." },
];

export default function Notebooks() {
  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
          Jupyter Notebooks
        </h1>
        <iframe
          className="w-full h-screen max-h-[80vh]"
          src="https://ng-jupyter.dev/lab/index.html"
        />
      </InnerPage>
    </PageLayout>
  );
}
