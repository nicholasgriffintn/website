const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

export const getYoutubeVideoId = (rawUrl?: string): string | null => {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];

      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const withSearchParam = url.searchParams.get('v');

      if (withSearchParam && YOUTUBE_ID_PATTERN.test(withSearchParam)) {
        return withSearchParam;
      }

      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length === 0 || !segments[0]) {
        return null;
      }

      // Handle URLs like /embed/VIDEO_ID, /shorts/VIDEO_ID, /live/VIDEO_ID, /watch/VIDEO_ID
      const potentialId =
        segments[1] &&
        ['embed', 'shorts', 'live', 'watch'].includes(segments[0])
          ? segments[1]
          : segments[0];

      return potentialId && YOUTUBE_ID_PATTERN.test(potentialId)
        ? potentialId
        : null;
    }
  } catch {
    return null;
  }

  return null;
};
