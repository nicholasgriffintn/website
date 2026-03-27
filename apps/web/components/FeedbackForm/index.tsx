"use client";

import { useMemo, useState } from "react";
import { Turnstile } from "react-turnstile";

import {
  ANONYMOUS_FROM_EMAIL,
  CONTACT_API_URL,
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
import { formatFeedbackBody } from "@/lib/feedback/formatFeedbackBody";

export function FeedbackForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);
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

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setLoading(true);
    setTurnstileWidgetKey((current) => current + 1);
  };

  const handleVerify = (token: string) => {
    setTurnstileToken(token);
    setLoading(false);
  };

  const handleTurnstileExpire = () => {
    resetTurnstile();
  };

  const handleTurnstileError = () => {
    resetTurnstile();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken || !relationship) {
      setError(true);
      return;
    }

    setSuccess(false);
    setError(false);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("cf-turnstile-response", turnstileToken);

    if (isAnonymous) {
      formData.set("from", ANONYMOUS_FROM_EMAIL);
    }

    formData.set(
      "subject",
      relationshipLabel
        ? `Website feedback submission (${relationshipLabel})`
        : "Website feedback submission",
    );

    formData.set(
      "body",
      formatFeedbackBody(formData, {
        isAnonymous,
        relationshipLabel: relationshipLabel ?? "Not provided",
        questions,
        questionSetLabel,
        includeOpenFeedback: showOpenFeedback,
      }),
    );

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        body: formData,
      });

      const { ok } = await response.json();

      setSubmitting(false);
      resetTurnstile();

      if (ok) {
        setSuccess(true);
        event.currentTarget.reset();
        setRelationship("");
        setIsAnonymous(false);
      } else {
        setError(true);
      }
    } catch (submitError) {
      console.error("Error sending feedback:", submitError);
      setSubmitting(false);
      setError(true);
      resetTurnstile();
    }
  };

  if (success) {
    return <div>Feedback submitted successfully. Thank you.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <input type="hidden" name="subject" value="Website feedback submission" />
      <input type="hidden" name="body" value="" />

      <FormSection title="Context">
        <label
          htmlFor="anonymous-feedback"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <input
            id="anonymous-feedback"
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.currentTarget.checked)}
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
              placeholder="name@company.com"
            />
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
                  className="h-4 w-4 accent-foreground"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
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
                />
              ))}
            </div>
          </FormSection>

          {showOpenFeedback && (
            <FormSection title="Open questions">
              <div className="space-y-2">
                <Label htmlFor="continue-doing">What should I continue doing? (optional)</Label>
                <Textarea id="continue-doing" name="continue_doing" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="improve">What should I improve? (optional)</Label>
                <Textarea id="improve" name="improve" rows={3} />
              </div>
            </FormSection>
          )}
        </>
      )}

      <Turnstile
        key={turnstileWidgetKey}
        sitekey={import.meta.env.VITE_EMAIL_TURNSTILE_SITE_KEY || ""}
        onVerify={handleVerify}
        onExpire={handleTurnstileExpire}
        onError={handleTurnstileError}
        refreshExpired="auto"
      />

      {error && <div>Failed to submit feedback. Please try again.</div>}
      {submitting && <div>Submitting...</div>}

      <Button type="submit" disabled={!hasSelectedRelationship || loading || submitting}>
        Submit feedback
      </Button>
    </form>
  );
}
