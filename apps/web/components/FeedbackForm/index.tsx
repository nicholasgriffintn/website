"use client";

import { useMemo, useState } from "react";
import { Turnstile } from "react-turnstile";

import {
  ANONYMOUS_FROM_EMAIL,
  CONTACT_API_URL,
  CORE_SECTIONS,
  FREQUENCY_OPTIONS,
  IMPACT_QUESTIONS,
  IMPROVEMENT_OPTIONS,
  MENTORING_SECTIONS,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_SECTION_VISIBILITY,
  STRENGTH_OPTIONS,
  TECHNICAL_QUESTIONS,
} from "@/components/FeedbackForm/constants";
import { FormSection } from "@/components/FeedbackForm/components/FormSection";
import { OptionLimitCheckbox } from "@/components/FeedbackForm/components/OptionLimitCheckbox";
import { RatingQuestion } from "@/components/FeedbackForm/components/RatingQuestion";
import type { Relationship } from "@/components/FeedbackForm/types";
import { getNextLimitedSelection } from "@/components/FeedbackForm/utils/selection";
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
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);

  const hasSelectedRelationship = Boolean(relationship);
  const showConferenceEvent = relationship === "conference-contact";
  const sectionVisibility = relationship ? RELATIONSHIP_SECTION_VISIBILITY[relationship] : null;
  const showFrequency = sectionVisibility?.showFrequency ?? false;
  const showCore = sectionVisibility?.showCore ?? false;
  const showTechnical = sectionVisibility?.showTechnical ?? false;
  const showMentoring = sectionVisibility?.showMentoring ?? false;
  const showCalibration = sectionVisibility?.showCalibration ?? false;
  const showOpenFeedback = sectionVisibility?.showOpenFeedback ?? false;
  const showOverallNote = sectionVisibility?.showOverallNote ?? false;

  const relationshipLabel = useMemo(
    () => RELATIONSHIP_OPTIONS.find((option) => option.value === relationship)?.label,
    [relationship],
  );

  const handleVerify = (token: string) => {
    setTurnstileToken(token);
    setLoading(false);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setLoading(true);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setLoading(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken) {
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
        includeFrequency: showFrequency,
        includeConferenceEvent: showConferenceEvent,
        includeCore: showCore,
        includeTechnical: showTechnical,
        includeMentoring: showMentoring,
        includeCalibration: showCalibration,
        includeOpenFeedback: showOpenFeedback,
        includeOverallNote: showOverallNote,
        isAnonymous,
        relationshipLabel: relationshipLabel ?? "Not provided",
      }),
    );

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        body: formData,
      });

      const { ok } = await response.json();

      setSubmitting(false);
      setTurnstileToken(null);
      setLoading(true);
      setTurnstileWidgetKey((current) => current + 1);

      if (ok) {
        setSuccess(true);
        event.currentTarget.reset();
        setRelationship("");
        setIsAnonymous(false);
        setStrengths([]);
        setImprovements([]);
      } else {
        setError(true);
      }
    } catch (submitError) {
      console.error("Error sending feedback:", submitError);
      setSubmitting(false);
      setError(true);
      setTurnstileToken(null);
      setLoading(true);
      setTurnstileWidgetKey((current) => current + 1);
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
          <legend className="text-sm font-medium">What is your relationship to me?</legend>
          <p className="text-xs text-muted-foreground">
            Team member and external collaborator refer to people connected to my current workplace.
          </p>
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

        {showConferenceEvent && (
          <div className="space-y-2">
            <Label htmlFor="conference-event">What conference/event did we meet at?</Label>
            <Input
              type="text"
              id="conference-event"
              name="conference_event"
              required={showConferenceEvent}
              placeholder="e.g. React Summit 2026"
            />
          </div>
        )}

        {showFrequency && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">How frequently do we work together?</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <label
                  key={option}
                  htmlFor={`frequency-${option}`}
                  className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
                >
                  <input
                    id={`frequency-${option}`}
                    type="radio"
                    name="frequency"
                    value={option}
                    required={showFrequency}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </FormSection>

      {!hasSelectedRelationship && (
        <p className="text-sm text-muted-foreground">
          Select your relationship to continue with role-specific questions.
        </p>
      )}

      {hasSelectedRelationship && (
        <>
          {showCore && (
            <FormSection title="Core effectiveness">
              <p className="text-sm text-muted-foreground">
                Rate each item from 1 (low) to 5 (high).
              </p>

              <div className="space-y-5">
                {[...CORE_SECTIONS, { title: "Impact", questions: IMPACT_QUESTIONS }].map(
                  (section) => (
                    <div key={section.title} className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </h3>
                      <div className="space-y-3">
                        {section.questions.map((question) => (
                          <RatingQuestion
                            key={question.id}
                            id={`${section.title === "Impact" ? "impact" : "core"}-${question.id}`}
                            name={`${section.title === "Impact" ? "impact" : "core"}_${question.id}`}
                            label={question.label}
                            required
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </FormSection>
          )}

          {showTechnical && (
            <FormSection title="Technical & engineering judgement">
              <div className="space-y-3">
                {TECHNICAL_QUESTIONS.map((question) => (
                  <RatingQuestion
                    key={question.id}
                    id={`technical-${question.id}`}
                    name={`technical_${question.id}`}
                    label={question.label}
                    required
                  />
                ))}
              </div>
            </FormSection>
          )}

          {showMentoring && (
            <FormSection title="Mentoring">
              <div className="space-y-5">
                {MENTORING_SECTIONS.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </h3>
                    <div className="space-y-3">
                      {section.questions.map((question) => (
                        <RatingQuestion
                          key={question.id}
                          id={`mentoring-${question.id}`}
                          name={`mentoring_${question.id}`}
                          label={question.label}
                          required
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          {showCalibration && (
            <FormSection title="Calibration">
              <p className="text-sm text-muted-foreground">
                Optional: select up to 2 in each group.
              </p>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">
                  Where am I strongest? (select up to 2, optional)
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {STRENGTH_OPTIONS.map((option) => (
                    <OptionLimitCheckbox
                      key={option}
                      id={`strength-${option}`}
                      name="strengths"
                      option={option}
                      selectedCount={strengths.length}
                      checked={strengths.includes(option)}
                      onToggle={(selectedOption, checked) =>
                        setStrengths((current) =>
                          getNextLimitedSelection(current, selectedOption, checked),
                        )
                      }
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">
                  Where should I improve most? (select up to 2, optional)
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {IMPROVEMENT_OPTIONS.map((option) => (
                    <OptionLimitCheckbox
                      key={option}
                      id={`improvement-${option}`}
                      name="improvements"
                      option={option}
                      selectedCount={improvements.length}
                      checked={improvements.includes(option)}
                      onToggle={(selectedOption, checked) =>
                        setImprovements((current) =>
                          getNextLimitedSelection(current, selectedOption, checked),
                        )
                      }
                    />
                  ))}
                </div>
              </fieldset>
            </FormSection>
          )}

          {showOpenFeedback && (
            <FormSection title="Open feedback">
              <p className="text-sm text-muted-foreground">
                Optional: you can fill any or all of these prompts.
              </p>
              <div className="space-y-2">
                <Label htmlFor="start-doing">One thing I should start doing (optional)</Label>
                <Textarea id="start-doing" name="start_doing" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stop-doing">One thing I should stop doing (optional)</Label>
                <Textarea id="stop-doing" name="stop_doing" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="continue-doing">One thing I should continue doing (optional)</Label>
                <Textarea id="continue-doing" name="continue_doing" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concrete-example">
                  Example of something I did well or poorly (optional)
                </Label>
                <Textarea id="concrete-example" name="concrete_example" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="single-improvement">
                  If I could improve only one thing to increase my impact, what should it be?{" "}
                  (optional)
                </Label>
                <Textarea id="single-improvement" name="single_improvement" rows={3} />
              </div>
            </FormSection>
          )}

          {showOverallNote && (
            <FormSection title="Overall note">
              <div className="space-y-2">
                <Label htmlFor="overall-note">
                  Share an overall impression or note from our interaction
                </Label>
                <Textarea id="overall-note" name="overall_note" rows={4} required />
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
