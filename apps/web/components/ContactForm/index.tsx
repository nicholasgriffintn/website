"use client";

import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { Turnstile } from "react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TURNSTILE_FIELD } from "@/lib/forms/constants";
import type { ContactActionData } from "@/lib/forms/contact";
import { useTurnstile } from "@/lib/forms/use-turnstile";

export function ContactForm() {
  const fetcher = useFetcher<ContactActionData>();
  const formRef = useRef<HTMLFormElement>(null);
  const turnstile = useTurnstile();

  const isSubmitting = fetcher.state !== "idle";
  const actionData = fetcher.data;
  const errors = actionData?.errors;
  const hasSuccess = actionData?.ok === true;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    if (fetcher.data.ok || fetcher.data.formError) {
      turnstile.reset();
    }

    if (fetcher.data.ok) {
      formRef.current?.reset();
    }
  }, [fetcher.data, fetcher.state, turnstile.reset]);

  if (hasSuccess) {
    return <div>Message sent successfully!</div>;
  }

  return (
    <fetcher.Form ref={formRef} method="post" className="max-w-lg space-y-4">
      <input type="hidden" name={TURNSTILE_FIELD} value={turnstile.token ?? ""} />

      <div>
        <Label htmlFor="from">Your email</Label>
        <Input
          type="email"
          id="from"
          name="from"
          autoComplete="email"
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(errors?.from)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {errors?.from ? <p className="mt-1 text-sm text-red-500">{errors.from}</p> : null}
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          type="text"
          id="subject"
          name="subject"
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(errors?.subject)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {errors?.subject ? <p className="mt-1 text-sm text-red-500">{errors.subject}</p> : null}
      </div>

      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={4}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors?.body)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {errors?.body ? <p className="mt-1 text-sm text-red-500">{errors.body}</p> : null}
      </div>

      <Turnstile
        key={turnstile.widgetKey}
        sitekey={import.meta.env.VITE_EMAIL_TURNSTILE_SITE_KEY || ""}
        onVerify={turnstile.handleVerify}
        onExpire={turnstile.handleExpire}
        onError={turnstile.handleError}
        refreshExpired="auto"
      />

      {turnstile.hasError ? (
        <div>Turnstile failed to load. Please refresh and try again.</div>
      ) : null}
      {errors?.turnstile ? <div>{errors.turnstile}</div> : null}
      {actionData?.formError ? <div>{actionData.formError}</div> : null}
      {isSubmitting ? <div>Submitting...</div> : null}

      <Button type="submit" disabled={!turnstile.token || isSubmitting}>
        Send Message
      </Button>
    </fetcher.Form>
  );
}
