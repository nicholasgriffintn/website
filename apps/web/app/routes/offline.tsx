import type { MetaFunction } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { Link } from "@/components/Link";

export const meta: MetaFunction = () => [
  { title: "Offline | Nicholas Griffin" },
  { name: "description", content: "You are offline right now." },
];

export default function Offline() {
  return (
    <PageLayout>
      <section className="w-full min-h-screen flex flex-col items-center justify-center bg-contain bg-center">
        <div className="container px-4 md:px-6 text-center space-y-6 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground">
            You are offline right now
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
            If you saved this page then you&apos;d be able read it right now.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px]">
            Sadly, you didn&apos;t do that. Maybe next time?
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px]">
            Go to the <Link href="/">home page</Link> or refresh when you have internet again.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
