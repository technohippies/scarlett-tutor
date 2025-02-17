import { useState, useEffect } from 'react';
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
  const [currentGateway, setCurrentGateway] = useState<'public' | 'premium'>('public');
  
  const imageUrl = currentGateway === 'public' 
    ? `https://premium.w3ipfs.storage/ipfs/${cid}`
    : `https://premium.w3ipfs.storage/ipfs/${cid}`;

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
    // If public gateway fails, try premium
    if (currentGateway === 'public') {
      console.log('Trying premium gateway...');
      setCurrentGateway('premium');
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Reset loading state when switching gateways
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [currentGateway]);

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