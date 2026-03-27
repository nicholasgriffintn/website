import type { FeedbackQuestion } from "@/components/FeedbackForm/types";

interface FormatFeedbackBodyOptions {
  isAnonymous: boolean;
  relationshipLabel: string;
  questions: readonly FeedbackQuestion[];
  questionSetLabel: string;
  includeOpenFeedback: boolean;
}

function getFormStringValue(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function formatRatings(formData: FormData, questions: readonly FeedbackQuestion[]) {
  return questions
    .map((question) => {
      const value = getFormStringValue(formData, `question_${question.id}`, "Not answered");
      return `- ${question.label}: ${value}`;
    })
    .join("\n");
}

export function formatFeedbackBody(formData: FormData, options: FormatFeedbackBodyOptions) {
  const { isAnonymous, relationshipLabel, questions, questionSetLabel, includeOpenFeedback } =
    options;

  const feedback = [
    "Feedback Submission",
    "",
    "Context",
    `Relationship: ${relationshipLabel}`,
    `Anonymous: ${isAnonymous ? "Yes" : "No"}`,
  ];

  if (!isAnonymous) {
    feedback.push(`Respondent email: ${getFormStringValue(formData, "from", "Not provided")}`);
  }

  feedback.push("", questionSetLabel, formatRatings(formData, questions));

  if (includeOpenFeedback) {
    feedback.push(
      "",
      "Open questions",
      `Continue doing: ${getFormStringValue(formData, "continue_doing", "Not provided")}`,
      `Improve: ${getFormStringValue(formData, "improve", "Not provided")}`,
    );
  }

  return feedback.join("\n");
}
