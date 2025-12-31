'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { Image } from '@/components/Image';
import './styles.css';
import { createWidgetStyles } from '@/lib/apple-music/artwork';
import ReturnImageFormattingUrl from '@/lib/returnImageFormattingUrl';
import type { RecentTracks } from '@/types/apple-music';
import { PauseIcon } from '@/components/Icons/PauseIcon';
import { PlayIcon } from '@/components/Icons/PlayIcon';

export function AppleMusicWidget({ data }: { data: RecentTracks | undefined }) {
  if (!data) {
    return null;
  }

  const tracksList = data;

  const firstTrack = tracksList?.length > 0 ? tracksList[0] : null;
  const firstTrackImage = firstTrack?.attributes.artwork.url
    ? firstTrack.attributes.artwork.url
        .replace('{w}', '700')
        .replace('{h}', '245')
    : null;
  const widgetStyle = createWidgetStyles(firstTrack?.attributes.artwork);

  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'none';
      audioRef.current = audio;
    }

    return audioRef.current;
  }, []);

  useEffect(() => {
    const audio = ensureAudio();

    if (!audio) {
      return;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTrackId(null);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [ensureAudio]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleToggleTrack = useCallback(
    async (track: RecentTracks[number]) => {
      const previewUrl = track?.attributes?.previews?.[0]?.url;

      if (!previewUrl) {
        if (track?.attributes?.url) {
          window.open(track.attributes.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      const audio = ensureAudio();

      if (!audio) {
        return;
      }

      if (currentTrackId === track.id) {
        if (audio.paused) {
          try {
            await audio.play();
          } catch (error) {
            console.error('Unable to play preview', error);
          }
        } else {
          audio.pause();
        }

        return;
      }

      audio.pause();
      audio.src = previewUrl;
      audio.currentTime = 0;

      try {
        await audio.play();
        setCurrentTrackId(track.id);
      } catch (error) {
        console.error('Unable to play preview', error);
        setCurrentTrackId(null);
      }
    },
    [currentTrackId, ensureAudio]
  );

  const isTrackPlaying = useCallback(
    (trackId: string | null) => isPlaying && trackId === currentTrackId,
    [currentTrackId, isPlaying]
  );

  return (
    <div id="applemusic-widget" style={widgetStyle}>
      <Suspense fallback={<div>Loading...</div>}>
        {firstTrack ? (
          <>
            <div className="applemusic-widget-latest">
              {firstTrackImage ? (
                <div
                  className="applemusic-widget-latest-background"
                  style={{
                    position: 'relative',
                  }}
                >
                  <Image
                    alt={firstTrack.attributes.name}
                    src={ReturnImageFormattingUrl(firstTrackImage)}
                    fill
                    style={{
                      objectFit: 'cover',
                    }}
                    unoptimized
                    width={700}
                    height={245}
                    loading="eager"
                  />
                </div>
              ) : null}
              <div className="applemusic-widget-latest-overlay">
                <div className="applemusic-widget-latest-actions">
                  <div className="applemusic-widget-latest-meta">
                    <h3>{firstTrack.attributes.name}</h3>
                    <span>{firstTrack.attributes.artistName}</span>
                    <span>{firstTrack.attributes.albumName}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`${
                      isTrackPlaying(firstTrack.id)
                        ? 'Pause'
                        : 'Play preview of'
                    } ${firstTrack.attributes.name}`}
                    className="trackLinkPlay"
                    onClick={() => handleToggleTrack(firstTrack)}
                    data-playing={
                      isTrackPlaying(firstTrack.id) ? 'true' : 'false'
                    }
                  >
                    {isTrackPlaying(firstTrack.id) ? (
                      <PauseIcon />
                    ) : (
                      <PlayIcon />
                    )}
                  </button>
                  {/* <a
                    className="trackLinkExternal"
                    href={firstTrack.attributes.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    Listen on Apple Music
                  </a> */}
                </div>
              </div>
            </div>
            <div className="applemusic-widget-tracks">
              {tracksList?.map((track, index) => {
                if (index !== 0) {
                  const trackImage = track.attributes.artwork.url
                    ? track.attributes.artwork.url
                        .replace('{w}', '700')
                        .replace('{h}', '245')
                    : null;

                  const isPlayingTrack = isTrackPlaying(track.id);

                  return (
                    <div
                      className="applemusic-widget-track-item"
                      key={`${track.id}_${track.attributes.issrc}`}
                    >
                      <div className="applemusic-widget-track-item-image">
                        <div className="applemusic-widget-track-item-image-inner">
                          {trackImage ? (
                            <Image
                              width="53"
                              height="53"
                              loading="lazy"
                              alt={track.attributes.albumName}
                              src={ReturnImageFormattingUrl(trackImage)}
                              style={{
                                objectFit: 'cover',
                              }}
                              unoptimized
                            />
                          ) : (
                            <div
                              className="applemusic-widget-track-item-image-placeholder"
                              aria-hidden="true"
                            />
                          )}
                          <button
                            type="button"
                            className="applemusic-widget-track-item-play"
                            onClick={() => handleToggleTrack(track)}
                            aria-label={`${
                              isPlayingTrack ? 'Pause' : 'Play preview of'
                            } ${track.attributes.name}`}
                            data-playing={isPlayingTrack ? 'true' : 'false'}
                          >
                            {isPlayingTrack ? <PauseIcon /> : <PlayIcon />}
                          </button>
                        </div>
                      </div>
                      <div className="applemusic-widget-track-item-content">
                        <div className="applemusic-widget-track-item-text">
                          <h3>{track.attributes.name}</h3>
                          <span>{track.attributes.artistName}</span>
                          <span>{track.attributes.albumName}</span>
                        </div>
                        {/* <a
                          className="trackLinkExternal"
                          rel="noopener noreferrer nofollow"
                          target="_blank"
                          href={track.attributes.url}
                        >
                          Listen on Apple Music
                        </a> */}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </>
        ) : null}
      </Suspense>
    </div>
  );
}
