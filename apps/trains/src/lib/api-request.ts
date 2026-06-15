import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

export function userIdFrom(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const sub = event.requestContext.authorizer.jwt.claims.sub;
  if (typeof sub !== "string" || sub.trim() === "") {
    throw new Error("Missing Cognito subject");
  }

  return sub;
}

export function parseJsonBody<T>(event: APIGatewayProxyEventV2WithJWTAuthorizer): T {
  if (!event.body) {
    throw new Error("Missing request body");
  }

  const decoded = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  return JSON.parse(decoded) as T;
}
