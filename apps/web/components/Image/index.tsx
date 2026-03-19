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
  fill?: boolean;
  unoptimized?: boolean;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

export function Image({
  src,
  alt,
  width,
  height,
  fill,
  unoptimized: _unoptimized,
  className,
  imgClassName,
  style,
  containerStyle,
  ...imgProps
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
    <div className={classes} style={containerStyle}>
      <picture>
        <img
          {...imgProps}
          src={buildSrc(src as string, imageDimensions?.width)}
          alt={alt}
          width={fill ? undefined : imageDimensions?.width}
          height={fill ? undefined : imageDimensions?.height}
          className={clsx("image__img", imgClassName)}
          style={
            fill
              ? {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  ...style,
                }
              : style
          }
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
