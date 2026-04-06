export function stripTrailingSlash(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "") || "/";
}

export function buildCanonicalUrl(origin: string, pathname: string) {
  const normalisedPathname = stripTrailingSlash(
    pathname.startsWith("/") ? pathname : `/${pathname}`,
  );
  return origin ? `${origin}${normalisedPathname}` : normalisedPathname;
}
