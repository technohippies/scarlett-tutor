import { useEffect, useRef } from 'react';
import { ring } from 'ldrs';

// Initialize loader once
ring.register();

interface RingLoaderProps {
  size?: 'default' | 'sm';
}

export function RingLoader({ size = 'default' }: RingLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderSize = size === 'sm' ? 24 : 40;
  const strokeWidth = size === 'sm' ? 2 : 3;

  useEffect(() => {
    // Register and create the loader
    ring.register();

    if (loaderRef.current) {
      const loader = document.createElement('l-ring');
      loader.setAttribute('size', loaderSize.toString());
      loader.setAttribute('stroke', strokeWidth.toString());
      loader.setAttribute('bg-opacity', '0');
      loader.setAttribute('speed', '2');
      loader.setAttribute('color', 'white');
      
      // Clear and append
      loaderRef.current.innerHTML = '';
      loaderRef.current.appendChild(loader);
    }
  }, [loaderSize, strokeWidth]);

  return <div ref={loaderRef} />;
} 