"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import "./styles.css";

import { Image } from "@/components/Image";
import imageLoader from "@/lib/imageLoader";
import type { MusicWidgetData, MusicWidgetTrack } from "@/types/music";
import { PauseIcon } from "@/components/Icons/PauseIcon";
import { PlayIcon } from "@/components/Icons/PlayIcon";

function TrackAction({
  track,
  isPlaying,
  className,
  onToggle,
}: {
  track: MusicWidgetTrack;
  isPlaying: boolean;
  className: string;
  onToggle: (track: MusicWidgetTrack) => void;
}) {
  if (track.previewUrl) {
    return (
      <button
        type="button"
        aria-label={`${isPlaying ? "Pause" : "Play preview of"} ${track.name}`}
        className={className}
        onClick={() => onToggle(track)}
        data-playing={isPlaying ? "true" : "false"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
    );
  }

  if (!track.url) {
    return null;
  }

  return (
    <a
      aria-label={`Open ${track.name}`}
      className={className}
      rel="noopener noreferrer nofollow"
      target="_blank"
      href={track.url}
      data-playing="false"
    >
      <PlayIcon />
    </a>
  );
}

export function AppleMusicWidget({ data }: { data: MusicWidgetData | undefined }) {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "none";
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

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [ensureAudio]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const tracksList = data?.tracks ?? [];
  const firstTrack = tracksList.length > 0 ? tracksList[0] : null;
  const firstTrackImage = firstTrack?.artworkUrl ?? null;
  const widgetStyle = data?.style;

  const handleToggleTrack = useCallback(
    async (track: MusicWidgetTrack) => {
      const previewUrl = track.previewUrl;

      if (!previewUrl) {
        if (track.url) {
          window.open(track.url, "_blank", "noopener,noreferrer");
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
            console.error("Unable to play preview", error);
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
        console.error("Unable to play preview", error);
        setCurrentTrackId(null);
      }
    },
    [currentTrackId, ensureAudio],
  );

  const isTrackPlaying = useCallback(
    (trackId: string | null) => isPlaying && trackId === currentTrackId,
    [currentTrackId, isPlaying],
  );

  if (!data || !firstTrack) {
    return null;
  }

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
                    position: "relative",
                  }}
                >
                  <Image
                    alt={firstTrack.name}
                    src={imageLoader({
                      src: firstTrackImage,
                      width: 700,
                    })}
                    fill
                    style={{
                      objectFit: "cover",
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
                    <h3>{firstTrack.name}</h3>
                    <span>{firstTrack.artistName}</span>
                    <span>{firstTrack.albumName}</span>
                  </div>
                  <TrackAction
                    track={firstTrack}
                    className="trackLinkPlay"
                    isPlaying={isTrackPlaying(firstTrack.id)}
                    onToggle={handleToggleTrack}
                  />
                </div>
              </div>
              {firstTrack.isNowPlaying ? (
                <div className="absolute left-0 bottom-0 z-10 bg-[#010517] text-primary-foreground px-1 py-1 text-sm">
                  <span>Now Playing</span>
                </div>
              ) : null}
            </div>
            <div className="applemusic-widget-tracks">
              {tracksList.slice(1).map((track) => {
                const isPlayingTrack = isTrackPlaying(track.id);

                return (
                  <div className="applemusic-widget-track-item" key={track.id}>
                    <div className="applemusic-widget-track-item-image">
                      <div className="applemusic-widget-track-item-image-inner">
                        {track.artworkUrl ? (
                          <Image
                            width="53"
                            height="53"
                            loading="lazy"
                            alt={track.albumName}
                            src={imageLoader({
                              src: track.artworkUrl,
                              width: 53,
                            })}
                            style={{
                              objectFit: "cover",
                            }}
                            unoptimized
                          />
                        ) : (
                          <div
                            className="applemusic-widget-track-item-image-placeholder"
                            aria-hidden="true"
                          />
                        )}
                        <TrackAction
                          track={track}
                          className="applemusic-widget-track-item-play"
                          isPlaying={isPlayingTrack}
                          onToggle={handleToggleTrack}
                        />
                      </div>
                    </div>
                    <div className="applemusic-widget-track-item-content">
                      <div className="applemusic-widget-track-item-text">
                        <h3>{track.name}</h3>
                        <span>{track.artistName}</span>
                        <span>{track.albumName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </Suspense>
    </div>
  );
}
