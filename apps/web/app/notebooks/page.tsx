import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";

export const metadata = {
  title: "Jupyter Notebooks",
  description: "A collection of jupyter notebooks.",
};

export default async function Home() {
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
