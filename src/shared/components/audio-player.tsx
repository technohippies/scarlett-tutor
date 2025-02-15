import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from "@phosphor-icons/react";
import { RingLoader } from './ring-loader';

interface AudioPlayerProps {
  src: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AudioPlayer({ src, size = 'md', className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setIsLoading(true);
    setIsPlaying(false);
  }, [src]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const handleClick = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        // Stop any other playing audio elements
        document.querySelectorAll('audio').forEach(audio => {
          if (audio !== audioRef.current) {
            audio.pause();
          }
        });
        
        await audioRef.current.play();
      } catch (error) {
        console.error('Failed to play audio:', error);
        setIsPlaying(false);
      }
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <>
      <audio 
        ref={audioRef}
        src={src}
        preload="auto"
      />
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`rounded-full bg-neutral-600 hover:bg-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${sizeClasses[size]} ${className}`}
      >
        <div className="flex items-center justify-center">
          {isLoading ? (
            <RingLoader size="sm" />
          ) : isPlaying ? (
            <Pause weight="fill" className={iconSizes[size]} />
          ) : (
            <Play weight="fill" className={iconSizes[size]} />
          )}
        </div>
      </button>
    </>
  );
} 