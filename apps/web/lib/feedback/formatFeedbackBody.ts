import {
  CORE_SECTIONS,
  IMPACT_QUESTIONS,
  MENTORING_SECTIONS,
  TECHNICAL_QUESTIONS,
} from "@/components/FeedbackForm/constants";
import type { FeedbackQuestion } from "@/components/FeedbackForm/types";

interface FormatFeedbackBodyOptions {
  includeFrequency: boolean;
  includeConferenceEvent: boolean;
  includeCore: boolean;
  includeTechnical: boolean;
  includeMentoring: boolean;
  includeCalibration: boolean;
  includeOpenFeedback: boolean;
  includeOverallNote: boolean;
  isAnonymous: boolean;
  relationshipLabel: string;
}

function getFormStringValue(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function getFormStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function formatRatings(formData: FormData, prefix: string, questions: readonly FeedbackQuestion[]) {
  return questions
    .map((question) => {
      const value = getFormStringValue(formData, `${prefix}_${question.id}`, "Not answered");
      return `- ${question.label}: ${value}`;
    })
    .join("\n");
}

export function formatFeedbackBody(formData: FormData, options: FormatFeedbackBodyOptions) {
  const {
    includeFrequency,
    includeConferenceEvent,
    includeCore,
    includeTechnical,
    includeMentoring,
    includeCalibration,
    includeOpenFeedback,
    includeOverallNote,
    isAnonymous,
    relationshipLabel,
  } = options;

  const frequency = getFormStringValue(formData, "frequency", "Not provided");
  const conferenceEvent = getFormStringValue(formData, "conference_event", "Not provided");
  const strengths = getFormStringArray(formData, "strengths");
  const improvements = getFormStringArray(formData, "improvements");

  const feedback = [
    "Feedback Submission",
    "",
    "Context",
    `Relationship: ${relationshipLabel}`,
    `Working frequency: ${includeFrequency ? frequency : "Not requested for this relationship type"}`,
    `Conference/event: ${
      includeConferenceEvent ? conferenceEvent : "Not requested for this relationship type"
    }`,
    `Anonymous: ${isAnonymous ? "Yes" : "No"}`,
  ];

  if (!isAnonymous) {
    feedback.push(`Respondent email: ${getFormStringValue(formData, "from", "Not provided")}`);
  }

  if (includeCore) {
    feedback.push(
      "",
      "Core effectiveness",
      ...CORE_SECTIONS.map(
        (section, index) =>
          `${section.title}\n${formatRatings(formData, "core", section.questions)}${
            index === CORE_SECTIONS.length - 1 ? "" : "\n"
          }`,
      ),
      "",
      "Impact",
      formatRatings(formData, "impact", IMPACT_QUESTIONS),
    );
  }

  if (includeTechnical) {
    feedback.push(
      "",
      "Technical & engineering judgement",
      formatRatings(formData, "technical", TECHNICAL_QUESTIONS),
    );
  }

  if (includeMentoring) {
    feedback.push(
      "",
      "Mentoring",
      MENTORING_SECTIONS.map(
        (section) => `${section.title}\n${formatRatings(formData, "mentoring", section.questions)}`,
      ).join("\n\n"),
    );
  }

  if (includeCalibration) {
    feedback.push(
      "",
      "Calibration",
      `Strongest areas: ${strengths.length ? strengths.join(", ") : "Not selected"}`,
      `Improvement areas: ${improvements.length ? improvements.join(", ") : "Not selected"}`,
    );
  }

  if (includeOpenFeedback) {
    feedback.push(
      "",
      "Open feedback",
      `Start doing: ${getFormStringValue(formData, "start_doing", "Not provided")}`,
      `Stop doing: ${getFormStringValue(formData, "stop_doing", "Not provided")}`,
      `Continue doing: ${getFormStringValue(formData, "continue_doing", "Not provided")}`,
      `Concrete example: ${getFormStringValue(formData, "concrete_example", "Not provided")}`,
      `Highest impact improvement: ${getFormStringValue(formData, "single_improvement", "Not provided")}`,
    );
  }

  if (includeOverallNote) {
    feedback.push("", "Overall note", getFormStringValue(formData, "overall_note", "Not provided"));
  }

  return feedback.join("\n");
}
