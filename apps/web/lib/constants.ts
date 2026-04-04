/** 30 minutes in seconds, used for CDN/proxy cache headers */
export const CACHE_MAX_AGE_SECONDS = 1800;
export const STALE_WHILE_REVALIDATE_SECONDS = 86400;

export const CDN_CACHE_HEADERS = {
  "Cache-Control": `public, max-age=0, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
} as const;
