import { lazy, Suspense } from "react";
import type { MetaFunction } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { ContactLinks } from "@/components/ContactLinks";
import { InnerPage } from "@/components/InnerPage";
import { Link } from "@/components/Link";

const ContactForm = lazy(() =>
  import("@/components/ContactForm").then((m) => ({ default: m.ContactForm })),
);

export const meta: MetaFunction = () => [
  { title: "Contact | Nicholas Griffin" },
  { name: "description", content: "Send me a message." },
];

export default function Contact() {
  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
          Send me a message
        </h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
            <div className="text-primary-foreground lg:max-w-[75%]">
              <p>I'm looking forward to hearing from you!</p>
              <p>
                Please fill in the form below to send me a message, alternatively, you can send me a
                message via one of the social networks below.
              </p>
              <p>
                If we have worked together or just chatted and you'd like to provide some feedback,
                I have a specific form for that as well, you can find it{" "}
                <Link href="/feedback">here</Link>.
              </p>
              <ContactLinks hideContactLink />
            </div>
          </div>
        </div>
        <hr className="my-4" />
        <small>
          If you prefer email clients over forms you can send me a message at{" "}
          <Link href="mailto:me@nicholasgriffin.dev">me@nicholasgriffin.dev</Link>.
        </small>
        <hr className="my-4" />
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </InnerPage>
    </PageLayout>
  );
}
