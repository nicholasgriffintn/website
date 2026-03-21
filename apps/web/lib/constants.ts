/** 30 minutes in seconds, used for CDN/proxy cache headers */
export const CACHE_MAX_AGE_SECONDS = 1800;

export const CDN_CACHE_HEADERS = {
  "Cache-Control": `s-maxage=${CACHE_MAX_AGE_SECONDS}`,
} as const;
