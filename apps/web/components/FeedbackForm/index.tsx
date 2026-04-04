"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Turnstile } from "react-turnstile";

import {
  CORE_QUESTIONS,
  MENTORING_QUESTIONS,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_QUESTION_SET,
  RELATIONSHIP_SECTION_VISIBILITY,
} from "@/components/FeedbackForm/constants";
import { FormSection } from "@/components/FeedbackForm/components/FormSection";
import { RatingQuestion } from "@/components/FeedbackForm/components/RatingQuestion";
import type { Relationship } from "@/components/FeedbackForm/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TURNSTILE_FIELD } from "@/lib/forms/constants";
import type { FeedbackActionData } from "@/lib/forms/feedback";
import { useTurnstile } from "@/lib/forms/use-turnstile";

export function FeedbackForm() {
  const fetcher = useFetcher<FeedbackActionData>();
  const formRef = useRef<HTMLFormElement>(null);
  const turnstile = useTurnstile();
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const hasSelectedRelationship = Boolean(relationship);
  const relationshipLabel = useMemo(
    () => RELATIONSHIP_OPTIONS.find((option) => option.value === relationship)?.label,
    [relationship],
  );

  const questionSet = relationship ? RELATIONSHIP_QUESTION_SET[relationship] : "core";
  const questions = questionSet === "mentoring" ? MENTORING_QUESTIONS : CORE_QUESTIONS;
  const questionSetLabel = questionSet === "mentoring" ? "Mentoring feedback" : "Core feedback";
  const sectionVisibility = relationship ? RELATIONSHIP_SECTION_VISIBILITY[relationship] : null;
  const showOpenFeedback = sectionVisibility?.showOpenFeedback ?? false;

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
      setRelationship("");
      setIsAnonymous(false);
    }
  }, [fetcher.data, fetcher.state, turnstile.reset]);

  if (hasSuccess) {
    return <div>Feedback submitted successfully. Thank you.</div>;
  }

  return (
    <fetcher.Form ref={formRef} method="post" className="max-w-3xl space-y-8">
      <input type="hidden" name={TURNSTILE_FIELD} value={turnstile.token ?? ""} />

      <FormSection title="Context">
        <label
          htmlFor="anonymous-feedback"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <input
            id="anonymous-feedback"
            type="checkbox"
            name="is_anonymous"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.currentTarget.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 accent-foreground"
          />
          Submit anonymously
        </label>

        {!isAnonymous ? (
          <div className="space-y-2">
            <Label htmlFor="from">Your email</Label>
            <Input
              type="email"
              id="from"
              name="from"
              autoComplete="email"
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errors?.from)}
              placeholder="name@company.com"
            />
            {errors?.from ? <p className="text-sm text-red-500">{errors.from}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your email is not requested. The submission will be sent as anonymous feedback.
          </p>
        )}

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Relationship</legend>
          <div className="space-y-2">
            {RELATIONSHIP_OPTIONS.map((option) => (
              <label
                key={option.value}
                htmlFor={`relationship-${option.value}`}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                <input
                  id={`relationship-${option.value}`}
                  type="radio"
                  name="relationship"
                  value={option.value}
                  required
                  checked={relationship === option.value}
                  onChange={() => setRelationship(option.value)}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-foreground"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {errors?.relationship ? (
            <p className="text-sm text-red-500">{errors.relationship}</p>
          ) : null}
        </fieldset>
      </FormSection>

      {hasSelectedRelationship && (
        <>
          <FormSection title={questionSetLabel}>
            <p className="text-sm text-muted-foreground">
              Rate each item from 1 (low) to 5 (high).
            </p>
            <div className="space-y-3">
              {questions.map((question) => (
                <RatingQuestion
                  key={question.id}
                  id={`question-${question.id}`}
                  name={`question_${question.id}`}
                  label={question.label}
                  required
                  disabled={isSubmitting}
                />
              ))}
            </div>
            {errors?.questions ? <p className="text-sm text-red-500">{errors.questions}</p> : null}
          </FormSection>

          {showOpenFeedback && (
            <FormSection title="Open questions">
              <div className="space-y-2">
                <Label htmlFor="continue-doing">What should I continue doing? (optional)</Label>
                <Textarea
                  id="continue-doing"
                  name="continue_doing"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="improve">What should I improve? (optional)</Label>
                <Textarea id="improve" name="improve" rows={3} disabled={isSubmitting} />
              </div>
            </FormSection>
          )}
        </>
      )}

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

      <Button type="submit" disabled={!hasSelectedRelationship || !turnstile.token || isSubmitting}>
        Submit feedback
      </Button>
    </fetcher.Form>
  );
}
