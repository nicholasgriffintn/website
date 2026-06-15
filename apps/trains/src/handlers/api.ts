import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

import { badRequest, notFound } from "../lib/http.js";
import {
  cancelSubscription,
  createListener,
  createSubscription,
  listListeners,
  listSubscriptions,
} from "../lib/subscription-api.js";

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    if (event.requestContext.http.method === "POST" && event.rawPath === "/listeners") {
      return createListener(event);
    }

    if (event.requestContext.http.method === "GET" && event.rawPath === "/listeners") {
      return listListeners(event);
    }

    if (event.requestContext.http.method === "POST" && event.rawPath === "/subscriptions") {
      return createSubscription(event);
    }

    if (event.requestContext.http.method === "GET" && event.rawPath === "/subscriptions") {
      return listSubscriptions(event);
    }

    if (
      event.requestContext.http.method === "DELETE" &&
      event.rawPath.startsWith("/subscriptions/")
    ) {
      return cancelSubscription(event);
    }

    return notFound();
  } catch (error) {
    console.error(error);
    return badRequest(error instanceof Error ? error.message : "Unknown error");
  }
}
