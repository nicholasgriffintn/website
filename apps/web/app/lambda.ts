import { createRequestHandler } from "react-router";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";

// Loaded once at cold start
const requestHandler = createRequestHandler({
  // @ts-expect-error - virtual module resolved at build time
  build: () => import("virtual:react-router/server-build"),
  mode: process.env.NODE_ENV ?? "production",
});

function lambdaEventToRequest(event: APIGatewayProxyEventV2): Request {
  const { requestContext, rawPath, rawQueryString, headers, body, isBase64Encoded } = event;

  const url = `https://${requestContext.domainName}${rawPath}${rawQueryString ? `?${rawQueryString}` : ""}`;

  const requestInit: RequestInit = {
    method: requestContext.http.method,
    headers: new Headers(headers as Record<string, string>),
  };

  if (body) {
    requestInit.body = isBase64Encoded ? Buffer.from(body, "base64") : body;
  }

  return new Request(url, requestInit);
}

async function responseToLambdaResult(
  response: Response,
): Promise<APIGatewayProxyStructuredResultV2> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = await response.text();

  return {
    statusCode: response.status,
    headers,
    body,
    isBase64Encoded: false,
  };
}

export async function handler(
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyStructuredResultV2> {
  const request = lambdaEventToRequest(event);
  const response = await requestHandler(request);
  return responseToLambdaResult(response);
}
