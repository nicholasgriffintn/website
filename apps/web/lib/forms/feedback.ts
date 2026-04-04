import {
  ANONYMOUS_FROM_EMAIL,
  CORE_QUESTIONS,
  LIKERT_VALUES,
  MENTORING_QUESTIONS,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_QUESTION_SET,
  RELATIONSHIP_SECTION_VISIBILITY,
} from "@/components/FeedbackForm/constants";
import type { FeedbackQuestion, Relationship } from "@/components/FeedbackForm/types";
import { formatFeedbackBody } from "@/lib/feedback/formatFeedbackBody";
import { TURNSTILE_FIELD } from "@/lib/forms/constants";
import { getTrimmedString, isValidEmailAddress } from "@/lib/forms/parsing";
import {
  createEmailSubmissionFormData,
  getSubmissionFailureStatus,
  submitEmailRequest,
} from "@/lib/forms/submit-email";

const VALID_LIKERT_VALUES = new Set(LIKERT_VALUES.map((value) => String(value)));
const RELATIONSHIP_LABEL_BY_VALUE = new Map(
  RELATIONSHIP_OPTIONS.map((relationship) => [relationship.value, relationship.label] as const),
);

export interface FeedbackFieldErrors {
  from?: string;
  relationship?: string;
  questions?: string;
  turnstile?: string;
}

export interface FeedbackActionData {
  ok: boolean;
  errors?: FeedbackFieldErrors;
  formError?: string;
}

interface FeedbackSubmissionPayload {
  from: string;
  relationship: Relationship;
  relationshipLabel: string;
  questionSetLabel: string;
  questions: readonly FeedbackQuestion[];
  includeOpenFeedback: boolean;
  isAnonymous: boolean;
  turnstileToken: string;
}

function resolveRelationship(value: string): Relationship | null {
  return RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.value ?? null;
}

function validateFeedbackForm(formData: FormData): {
  errors: FeedbackFieldErrors;
  payload?: FeedbackSubmissionPayload;
} {
  const relationshipValue = getTrimmedString(formData, "relationship");
  const relationship = resolveRelationship(relationshipValue);
  const relationshipLabel = relationship ? RELATIONSHIP_LABEL_BY_VALUE.get(relationship) : null;
  const isAnonymous = formData.get("is_anonymous") === "on";
  const fromInput = getTrimmedString(formData, "from");
  const turnstileToken = getTrimmedString(formData, TURNSTILE_FIELD);

  const errors: FeedbackFieldErrors = {};

  if (!relationship) {
    errors.relationship = "Please choose your relationship.";
  }

  if (!isAnonymous) {
    if (!fromInput) {
      errors.from = "Please provide your email address.";
    } else if (!isValidEmailAddress(fromInput)) {
      errors.from = "Please provide a valid email address.";
    }
  }

  if (!turnstileToken) {
    errors.turnstile = "Please complete the Turnstile challenge.";
  }

  let questions: readonly FeedbackQuestion[] = CORE_QUESTIONS;
  let questionSetLabel = "Core feedback";
  let includeOpenFeedback = true;

  if (relationship) {
    const questionSet = RELATIONSHIP_QUESTION_SET[relationship];
    if (questionSet === "mentoring") {
      questions = MENTORING_QUESTIONS;
      questionSetLabel = "Mentoring feedback";
    }

    includeOpenFeedback = RELATIONSHIP_SECTION_VISIBILITY[relationship].showOpenFeedback;

    const hasMissingAnswers = questions.some((question) => {
      const answer = getTrimmedString(formData, `question_${question.id}`);
      return !VALID_LIKERT_VALUES.has(answer);
    });

    if (hasMissingAnswers) {
      errors.questions = "Please answer each rating question before submitting.";
    }
  }

  if (Object.keys(errors).length > 0 || !relationship || !relationshipLabel) {
    return { errors };
  }

  return {
    errors,
    payload: {
      from: isAnonymous ? ANONYMOUS_FROM_EMAIL : fromInput,
      relationship,
      relationshipLabel,
      questionSetLabel,
      questions,
      includeOpenFeedback,
      isAnonymous,
      turnstileToken,
    },
  };
}

export async function processFeedbackFormSubmission(formData: FormData): Promise<{
  status: number;
  body: FeedbackActionData;
}> {
  const validation = validateFeedbackForm(formData);

  if (!validation.payload) {
    return {
      status: 400,
      body: {
        ok: false,
        errors: validation.errors,
      },
    };
  }

  const {
    from,
    relationship,
    relationshipLabel,
    questionSetLabel,
    questions,
    includeOpenFeedback,
    isAnonymous,
    turnstileToken,
  } = validation.payload;

  const subject = `Website feedback submission (${relationshipLabel})`;

  formData.set("from", from);
  formData.set("relationship", relationship);
  formData.set("subject", subject);
  formData.set(TURNSTILE_FIELD, turnstileToken);
  formData.set(
    "body",
    formatFeedbackBody(formData, {
      isAnonymous,
      relationshipLabel,
      questions,
      questionSetLabel,
      includeOpenFeedback,
    }),
  );

  const outbound = createEmailSubmissionFormData({
    from: getTrimmedString(formData, "from"),
    subject: getTrimmedString(formData, "subject"),
    body: getTrimmedString(formData, "body"),
    turnstileToken: getTrimmedString(formData, TURNSTILE_FIELD),
  });

  const submitResult = await submitEmailRequest(outbound);

  if (submitResult.ok) {
    return {
      status: 200,
      body: {
        ok: true,
      },
    };
  }

  return {
    status: getSubmissionFailureStatus(submitResult.kind),
    body: {
      ok: false,
      formError: "Failed to submit feedback right now. Please try again in a moment.",
    },
  };
}
