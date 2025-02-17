import { useState } from 'react';
import { RingLoader } from './ring-loader';
import { Dialog, DialogContent, DialogTrigger } from './dialog';
import { cn } from '../utils';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageUrl = `https://public.w3ipfs.storage/ipfs/${cid}`;

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: ''
  }[aspectRatio];

  const handleLoad = () => {
    console.log('Image loaded:', imageUrl);
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    console.error('Image failed to load:', imageUrl);
    setIsLoading(false);
    setHasError(true);
  };

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
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <RingLoader size="sm" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 text-sm text-neutral-400">
          Failed to load image
        </div>
      )}
      <img 
        src={imageUrl}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading || hasError ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );

  if (enableDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {ImageComponent}
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <img 
            src={imageUrl}
            alt={alt}
            className={cn(
              "w-full h-full object-contain",
              hasError ? 'hidden' : 'block'
            )}
            onError={handleError}
          />
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