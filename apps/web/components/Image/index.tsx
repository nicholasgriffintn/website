"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

const IMAGE_SERVICE = "https://images.s3rve.co.uk";

function buildSrc(src: string, width?: number): string {
  if (!src || src.startsWith("http")) return src;
  return `${IMAGE_SERVICE}/?width=${width ?? 1920}&image=${src}`;
}

type ImageProps = {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

export function Image({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
  style,
  ...props
}: ImageProps) {
  const [imageDimensions, setImageDimensions] = useState<{
    width?: number;
    height?: number;
  }>({
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
  });
  const [imageError, setImageError] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    if (!width && !height && src) {
      fetch(`${IMAGE_SERVICE}/?width=1920&format=json&image=${src}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.width && data?.height) {
            setImageDimensions({ width: data.width, height: data.height });
          } else {
            setImageError(true);
          }
        })
        .catch(() => setImageError(true));
    }
  }, [src, width, height]);

  const classes = clsx(
    "image",
    !loadingComplete ? "image--loading" : "",
    imageError ? "image--error" : "",
    className,
  );

  return (
    <div className={classes} style={style}>
      <picture>
        <img
          {...props}
          src={buildSrc(src as string, imageDimensions?.width)}
          alt={alt}
          width={imageDimensions?.width}
          height={imageDimensions?.height}
          className={clsx("image__img", imgClassName)}
          onError={() => {
            setImageError(true);
            setLoadingComplete(true);
          }}
          onLoad={() => setLoadingComplete(true)}
        />
      </picture>
    </div>
  );
}
