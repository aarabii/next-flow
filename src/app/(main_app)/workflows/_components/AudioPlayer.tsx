"use client";

import * as React from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  url: string;
}

export function AudioPlayer({ url }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error("Audio playback error:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-zinc-50 border border-zinc-150 rounded-lg nodrag w-full box-border overflow-hidden">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />
      {/* Slider Row */}
      <div className="w-full px-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-purple-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer block"
        />
      </div>
      {/* Controls Row */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs border-0"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-white text-white" />
            ) : (
              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
            )}
          </button>
          <span className="text-[10px] font-mono text-zinc-500 select-none shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Waveform graphic decoration */}
        <div className="flex items-end gap-[2px] h-4 shrink-0 select-none px-1">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes soundWave {
              0%, 100% { height: 30%; }
              50% { height: 100%; }
            }
            .animate-wave {
              animation: soundWave 1.2s ease-in-out infinite;
            }
          `}} />
          {[
            { defaultHeight: "h-[60%]", delay: "0s" },
            { defaultHeight: "h-[40%]", delay: "0.2s" },
            { defaultHeight: "h-[80%]", delay: "0.4s" },
            { defaultHeight: "h-[50%]", delay: "0.15s" },
            { defaultHeight: "h-[70%]", delay: "0.3s" },
            { defaultHeight: "h-[30%]", delay: "0.5s" },
          ].map((bar, i) => (
            <span
              key={i}
              style={{
                animationDelay: isPlaying ? bar.delay : undefined,
              }}
              className={cn(
                "w-[2px] bg-purple-600 rounded-full transition-all duration-300",
                isPlaying ? "animate-wave" : bar.defaultHeight
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
