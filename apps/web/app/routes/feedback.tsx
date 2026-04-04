import { lazy, Suspense } from "react";
import { data, type MetaFunction, useLoaderData } from "react-router";
import type { Route } from "./+types/feedback";

import { InnerPage } from "@/components/InnerPage";
import { LoadingState } from "@/components/LoadingState";
import { PageLayout } from "@/components/PageLayout";
import { processFeedbackFormSubmission } from "@/lib/forms/feedback";
import { getTurnstileSiteKey } from "@/lib/forms/turnstile";

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

export function loader({ context }: Route.LoaderArgs) {
  return {
    turnstileSiteKey: getTurnstileSiteKey(context),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = await processFeedbackFormSubmission(formData);
  return data(result.body, { status: result.status });
}

export default function Feedback() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>();

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
            Choose your relationship to me, then answer a short set of 1-5 rating questions tailored
            to that context.
          </p>
        </div>
        <hr className="my-4" />
        <Suspense fallback={<LoadingState label="Loading feedback form..." className="py-4" />}>
          <FeedbackForm turnstileSiteKey={turnstileSiteKey} />
        </Suspense>
      </InnerPage>
    </PageLayout>
  );
}
