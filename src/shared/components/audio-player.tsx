import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from "@phosphor-icons/react";
import { RingLoader } from './ring-loader';
import { mediaPreloader } from '../services/media-preloader';

interface AudioPlayerProps {
  src: string;
  cid?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AudioPlayer({ src, cid, size = 'md', className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Load audio when cid changes
  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      if (!cid) {
        // If no CID provided, use direct URL
        setAudioUrl(src);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);

        const blob = await mediaPreloader.preloadMedia(cid);
        if (!mounted) return;

        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load audio:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAudio();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cid, src]);

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

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <audio 
        ref={audioRef}
        src={audioUrl || src}
        preload="auto"
      />
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <RingLoader size="sm" />
        ) : isPlaying ? (
          <Pause weight="fill" className={iconSizes[size]} />
        ) : (
          <Play weight="fill" className={iconSizes[size]} />
        )}
      </button>
    </div>
  );
} 