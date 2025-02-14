import { useEffect } from 'react';
import { ring } from 'ldrs';

// Initialize loader
ring.register();

interface RingLoaderProps {
  size?: 'default' | 'sm';
}

export function RingLoader({ size = 'default' }: RingLoaderProps) {
  const loaderSize = size === 'sm' ? 24 : 40;
  const strokeWidth = size === 'sm' ? 2 : 3;

  return (
    <l-ring
      size={loaderSize}
      stroke={strokeWidth}
      bg-opacity="0"
      speed="2"
      color="white"
    />
  );
} 