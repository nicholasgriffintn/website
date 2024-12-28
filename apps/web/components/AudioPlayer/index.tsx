'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Volume2, Play, Pause, VolumeX, Volume1, Volume } from 'lucide-react';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function AudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const [prevVolume, setPrevVolume] = useState(100);
    const volumeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            const audioDuration = audio.duration;
            if (audioDuration && !isNaN(audioDuration)) {
                setDuration(audioDuration);
            }
        };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('canplay', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        if (audio.readyState > 0) {
            setAudioData();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('canplay', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
                setIsVolumeOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeChange = (newValue: number[]) => {
        if (!audioRef.current || !duration) return;
        const time = newValue[0];
        if (time !== undefined) {
            const newTime = (time * duration) / 100;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (newValue: number[]) => {
        if (!audioRef.current) return;
        const newVolume = newValue[0];
        if (newVolume !== undefined) {
            audioRef.current.volume = newVolume / 100;
            setVolume(newVolume);
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        
        if (volume > 0) {
            setPrevVolume(volume);
            handleVolumeChange([0]);
        } else {
            handleVolumeChange([prevVolume]);
        }
    };

    const getVolumeIcon = () => {
        if (volume === 0) return <VolumeX className="h-4 w-4" />;
        if (volume < 33) return <Volume className="h-4 w-4" />;
        if (volume < 67) return <Volume1 className="h-4 w-4" />;
        return <Volume2 className="h-4 w-4" />;
    };

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getCurrentProgress = () => {
        if (!duration) return 0;
        return (currentTime / duration) * 100;
    };

    if (!src) return null;

    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <audio ref={audioRef} src={src} />
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>

            <div className="flex-1 space-y-1">
              <Slider
                value={[getCurrentProgress()]}
                max={100}
                step={1}
                className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                onValueChange={handleTimeChange}
                aria-label={`Audio progress: ${formatTime(
                  currentTime
                )} / ${formatTime(duration)}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="relative flex items-center gap-2" ref={volumeRef}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={toggleMute}
                onMouseEnter={() => setIsVolumeOpen(true)}
              >
                {getVolumeIcon()}
                <span className="sr-only">Volume</span>
              </Button>
              {isVolumeOpen && (
                <div className="absolute bg-background border rounded-lg p-3 shadow-lg -top-32 right-0 z-50">
                  <Slider
                    orientation="vertical"
                    value={[volume]}
                    max={100}
                    step={1}
                    className="h-24 [&_[role=slider]]:left-1/2 [&_[role=slider]]:-translate-x-1/2"
                    onValueChange={handleVolumeChange}
                    aria-label={`Volume: ${volume}%`}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
}

