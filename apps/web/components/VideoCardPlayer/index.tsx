'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';

import { Image } from '@/components/Image';

export function VideoCardPlayer({ videoId, slug, title }) {
  const [videoActive, setVideoActive] = useState(false);

  useEffect(() => {
    setVideoActive(false);
  }, [videoId, slug]);

  return (
    <>
      {videoActive ? (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          aria-label={`Play video: ${title}`}
          className="group relative block h-full w-full overflow-hidden bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={() => setVideoActive(true)}
        >
          <Image
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
            width={1280}
            height={720}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105"
          />
          <span className="pointer-events-none absolute inset-0 bg-black/40 transition group-hover:bg-black/60" />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-105 group-focus-visible:scale-105">
              <Play className="h-6 w-6" strokeWidth={1.5} />
            </span>
          </span>
          <span className="sr-only">{`Play video for ${title}`}</span>
        </button>
      )}
    </>
  );
}
