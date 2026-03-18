import { PageLayout } from "@/components/PageLayout";

export default function Home() {
  return (
    <PageLayout>
      <section className="w-full min-h-screen flex flex-col items-center justify-center bg-contain bg-center">
        <div className="container px-4 md:px-6 text-center space-y-6 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground">
            Sorry, this page could not be found.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px]">
            Please check the URL in the address bar and try again. Or go back to the home page.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
