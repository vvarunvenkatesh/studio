// components/ui/image.tsx
'use client';

import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type ImageProps = NextImageProps & {
  // Add any custom props if needed in the future
};

const Image = ({ className, ...props }: ImageProps) => {
  return (
    <NextImage
      className={cn(className)}
      {...props}
      // You can add default props here if desired
      // e.g., loading="lazy"
    />
  );
};

Image.displayName = 'Image';

export { Image };
