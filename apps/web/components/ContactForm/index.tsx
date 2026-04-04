"use client";

import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { Turnstile } from "react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/LoadingState";
import { Spinner } from "@/components/Spinner";
import { TURNSTILE_FIELD } from "@/lib/forms/constants";
import type { ContactActionData } from "@/lib/forms/contact";
import { useTurnstile } from "@/lib/forms/use-turnstile";

type ContactFormProps = {
  turnstileSiteKey: string;
};

export function ContactForm({ turnstileSiteKey }: ContactFormProps) {
  const fetcher = useFetcher<ContactActionData>();
  const formRef = useRef<HTMLFormElement>(null);
  const turnstile = useTurnstile();

  const isSubmitting = fetcher.state !== "idle";
  const actionData = fetcher.data;
  const errors = actionData?.errors;
  const hasSuccess = actionData?.ok === true;
  const hasTurnstileSiteKey = turnstileSiteKey.trim().length > 0;

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
    <fetcher.Form
      ref={formRef}
      method="post"
      className="max-w-lg space-y-4"
      aria-busy={isSubmitting}
    >
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

      {hasTurnstileSiteKey ? (
        <Turnstile
          key={turnstile.widgetKey}
          sitekey={turnstileSiteKey}
          onVerify={turnstile.handleVerify}
          onExpire={turnstile.handleExpire}
          onError={turnstile.handleError}
          refreshExpired="auto"
        />
      ) : null}

      {turnstile.hasError ? (
        <div>Turnstile failed to load. Please refresh and try again.</div>
      ) : null}
      {errors?.turnstile ? <div>{errors.turnstile}</div> : null}
      {actionData?.formError ? <div>{actionData.formError}</div> : null}
      {isSubmitting ? <LoadingState label="Submitting message..." /> : null}

      <Button type="submit" disabled={!hasTurnstileSiteKey || !turnstile.token || isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner className="h-4 w-4" />
            Sending...
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </fetcher.Form>
  );
}
