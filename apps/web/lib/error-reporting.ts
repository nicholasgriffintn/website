import { isRecord } from "@/lib/type-guards";
import { truncateOptional, truncateWithEllipsis } from "@/lib/strings";
import { unknownToString } from "@/lib/unknown";

const MAX_FIELD_LENGTH = 2_000;
const MAX_STACK_LENGTH = 8_000;
const MAX_PARAM_KEY_LENGTH = 120;
const MAX_PARAM_VALUE_LENGTH = 400;
const MAX_PARAMS = 25;

export type ErrorSource = "react-dom-server" | "react-router-server" | "react-router-client";

export type ErrorReportContext = {
  source: ErrorSource;
  method?: string;
  url?: string;
  routePattern?: string;
  params?: Record<string, string | undefined>;
  componentStack?: string;
};

type SerializableError = {
  name: string;
  message: string;
  stack?: string;
};

function sanitiseText(value: string | undefined, maxLength = MAX_FIELD_LENGTH) {
  return truncateOptional(value, maxLength);
}

function normaliseError(error: unknown): SerializableError {
  if (error instanceof Error) {
    return {
      name: truncateWithEllipsis(error.name || "Error", MAX_FIELD_LENGTH),
      message: truncateWithEllipsis(error.message || "Unknown error", MAX_FIELD_LENGTH),
      stack: sanitiseText(error.stack, MAX_STACK_LENGTH),
    };
  }

  if (isRecord(error)) {
    const name = typeof error.name === "string" ? error.name : "NonErrorThrown";
    const message = typeof error.message === "string" ? error.message : unknownToString(error);
    const stack = typeof error.stack === "string" ? error.stack : undefined;

    return {
      name: truncateWithEllipsis(name, MAX_FIELD_LENGTH),
      message: truncateWithEllipsis(message, MAX_FIELD_LENGTH),
      stack: sanitiseText(stack, MAX_STACK_LENGTH),
    };
  }

  return {
    name: "NonErrorThrown",
    message: truncateWithEllipsis(unknownToString(error), MAX_FIELD_LENGTH),
  };
}

function sanitiseParams(params: Record<string, string | undefined> | undefined) {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params).slice(0, MAX_PARAMS);

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(
    entries.map(([key, value]) => [
      truncateWithEllipsis(key, MAX_PARAM_KEY_LENGTH),
      typeof value === "string" ? truncateWithEllipsis(value, MAX_PARAM_VALUE_LENGTH) : undefined,
    ]),
  );
}

export function reportApplicationError(error: unknown, context: ErrorReportContext) {
  const report = {
    timestamp: new Date().toISOString(),
    source: context.source,
    method: sanitiseText(context.method, 64),
    url: sanitiseText(context.url),
    routePattern: sanitiseText(context.routePattern, 400),
    params: sanitiseParams(context.params),
    componentStack: sanitiseText(context.componentStack, MAX_STACK_LENGTH),
    error: normaliseError(error),
  };

  console.error("[application-error]", report);
}
