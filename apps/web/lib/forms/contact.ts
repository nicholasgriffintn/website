import { TURNSTILE_FIELD } from "@/lib/forms/constants";
import { getTrimmedString, isValidEmailAddress } from "@/lib/forms/parsing";
import {
  createEmailSubmissionFormData,
  getSubmissionFailureStatus,
  submitEmailRequest,
} from "@/lib/forms/submit-email";

export interface ContactFieldErrors {
  from?: string;
  subject?: string;
  body?: string;
  turnstile?: string;
}

export interface ContactActionData {
  ok: boolean;
  errors?: ContactFieldErrors;
  formError?: string;
}

interface ContactSubmissionPayload {
  from: string;
  subject: string;
  body: string;
  turnstileToken: string;
}

function validateContactForm(formData: FormData): {
  errors: ContactFieldErrors;
  payload?: ContactSubmissionPayload;
} {
  const from = getTrimmedString(formData, "from");
  const subject = getTrimmedString(formData, "subject");
  const body = getTrimmedString(formData, "body");
  const turnstileToken = getTrimmedString(formData, TURNSTILE_FIELD);

  const errors: ContactFieldErrors = {};

  if (!from) {
    errors.from = "Please provide your email address.";
  } else if (!isValidEmailAddress(from)) {
    errors.from = "Please provide a valid email address.";
  }

  if (!subject) {
    errors.subject = "Please provide a subject.";
  }

  if (!body) {
    errors.body = "Please enter a message.";
  }

  if (!turnstileToken) {
    errors.turnstile = "Please complete the Turnstile challenge.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    payload: {
      from,
      subject,
      body,
      turnstileToken,
    },
  };
}

export async function processContactFormSubmission(formData: FormData): Promise<{
  status: number;
  body: ContactActionData;
}> {
  const validation = validateContactForm(formData);

  if (!validation.payload) {
    return {
      status: 400,
      body: {
        ok: false,
        errors: validation.errors,
      },
    };
  }

  const outbound = createEmailSubmissionFormData(validation.payload);

  const submitResult = await submitEmailRequest(outbound);

  if (submitResult.ok) {
    return {
      status: 200,
      body: {
        ok: true,
      },
    };
  }

  console.error("Email submission failed", {
    result: submitResult,
  });

  return {
    status: getSubmissionFailureStatus(submitResult.kind),
    body: {
      ok: false,
      formError: "Failed to send message right now. Please try again in a moment.",
    },
  };
}
