import { getEnvValue } from "@/lib/env";

const DEFAULT_PRODUCTION_ORIGIN = "https://nicholasgriffin.dev";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function normaliseProtocol(value: string) {
  const normalised = value.replace(/:$/, "").toLowerCase();
  return normalised === "http" || normalised === "https" ? normalised : "https";
}

function extractHostname(host: string) {
  return host.split(":")[0]?.toLowerCase() || "";
}

function isLocalHost(host: string) {
  const hostname = extractHostname(host);
  return (
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.startsWith("127.") ||
    hostname.endsWith(".local")
  );
}

export function resolveRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const hostHeader = firstHeaderValue(request.headers.get("host"));
  const protocolHeader = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = normaliseProtocol(protocolHeader || url.protocol);

  const hostCandidates = [forwardedHost, hostHeader, url.host].filter(Boolean);
  const firstPublicHost = hostCandidates.find((host) => !isLocalHost(host));
  if (firstPublicHost) {
    return `${protocol}://${firstPublicHost}`;
  }

  const isDevelopment = import.meta.env.DEV === true;
  const configuredOrigin = getEnvValue("CANONICAL_ORIGIN") || DEFAULT_PRODUCTION_ORIGIN;

  if (isLocalHost(url.host)) {
    return isDevelopment ? url.origin : configuredOrigin;
  }

  return url.origin;
}
