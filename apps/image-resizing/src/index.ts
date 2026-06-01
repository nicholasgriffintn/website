import { withSentry } from "@sentry/cloudflare";

import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "./constants";
import { handleImageRequest } from "./handler";

const handler = {
  fetch: handleImageRequest,
};

export default withSentry(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  }),
  handler,
);
