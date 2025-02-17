import { useState, useEffect } from 'react';
import { RingLoader } from './ring-loader';
import { Dialog, DialogContent, DialogTrigger } from './dialog';
import { cn } from '../utils';
import { mediaPreloader } from '../services/media-preloader';

interface IPFSImageProps {
  cid: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  onClick?: () => void;
  enableDialog?: boolean;
}

export function IPFSImage({ 
  cid, 
  alt = '', 
  className = '',
  containerClassName = '',
  aspectRatio = 'square',
  onClick,
  enableDialog = false
}: IPFSImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (!cid) return;
      
      try {
        setIsLoading(true);
        setHasError(false);
        setLoadProgress(0);

        const blob = await mediaPreloader.preloadMedia(cid, {
          onProgress: (progress) => {
            if (mounted) setLoadProgress(progress);
          },
          onError: () => {
            if (mounted) setHasError(true);
          }
        });

        if (!mounted) return;

        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load image:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    void loadImage();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cid]);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: ''
  }[aspectRatio];

  const ImageComponent = (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg bg-neutral-800",
        aspectRatioClass,
        containerClassName
      )}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <div className="text-center">
            <RingLoader />
            {loadProgress > 0 && (
              <div className="mt-2 text-sm text-neutral-400">
                {Math.round(loadProgress * 100)}%
              </div>
            )}
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <div className="text-center text-neutral-400">
            Failed to load image
          </div>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "w-full h-full object-contain",
            isLoading ? 'opacity-0' : 'opacity-100',
            'transition-opacity duration-200',
            className
          )}
        />
      )}
    </div>
  );

  if (enableDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {ImageComponent}
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {imageUrl && (
            <img 
              src={imageUrl}
              alt={alt}
              className={cn(
                "w-full h-full object-contain",
                hasError ? 'hidden' : 'block',
                className
              )}
              onError={() => {
                setHasError(true);
              }}
            />
          )}
          {hasError && (
            <div className="p-8 text-center text-neutral-400">
              Failed to load image
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return ImageComponent;
} 