import { lazy, Suspense } from "react";
import type { MetaFunction } from "react-router";

import { InnerPage } from "@/components/InnerPage";
import { PageLayout } from "@/components/PageLayout";

const FeedbackForm = lazy(() =>
  import("@/components/FeedbackForm").then((module) => ({ default: module.FeedbackForm })),
);

export const meta: MetaFunction = () => [
  { title: "Feedback | Nicholas Griffin" },
  {
    name: "description",
    content: "Share structured feedback for collaboration, engineering, and mentoring.",
  },
];

export default function Feedback() {
  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl font-bold text-primary-foreground md:text-4xl">Share feedback</h1>
        <div className="pt-5 text-primary-foreground lg:max-w-[75%]">
          <p>
            This form is for anyone who has worked with me, chatted with me, or received help from
            me and would like to share feedback on our interactions.
          </p>
          <p>
            It covers three main areas: collaboration, engineering, and mentoring, depending on the
            nature of our interactions. You can choose which sections to fill out based on what you
            feel is most relevant.
          </p>
          <p>
            Ratings are 1 to 5, and open prompts are structured to keep feedback concrete and
            actionable.
          </p>
        </div>
        <hr className="my-4" />
        <Suspense fallback={null}>
          <FeedbackForm />
        </Suspense>
      </InnerPage>
    </PageLayout>
  );
}
