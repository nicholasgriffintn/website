"use client";

import { use, useState } from "react";
import clsx from "clsx";

const IMAGE_SERVICE = "https://images.s3rve.co.uk";

const RESPONSIVE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048];

type Dimensions = { width: number; height: number };

const dimensionCache = new Map<string, Promise<Dimensions | null>>();

function fetchDimensions(src: string): Promise<Dimensions | null> {
  const cached = dimensionCache.get(src);
  if (cached) return cached;

  const promise = fetch(`${IMAGE_SERVICE}/?width=1920&format=json&image=${src}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) =>
      data?.width && data?.height ? { width: data.width, height: data.height } : null,
    )
    .catch(() => null);

  dimensionCache.set(src, promise);
  return promise;
}

function isExternal(src: string): boolean {
  return !src || src.startsWith("http");
}

function buildSrc(src: string, width?: number, format?: string): string {
  if (isExternal(src)) return src;
  const params = new URLSearchParams();
  params.set("width", String(width ?? 1920));
  params.set("image", src);
  if (format) params.set("format", format);
  return `${IMAGE_SERVICE}/?${params.toString()}`;
}

function buildSrcSet(src: string, format?: string): string {
  return RESPONSIVE_WIDTHS.map((w) => `${buildSrc(src, w, format)} ${w}w`).join(", ");
}

type ImageProps = {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  unoptimized?: boolean;
  priority?: boolean;
  sizes?: string;
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
  unoptimized,
  priority,
  sizes = "100vw",
  className,
  imgClassName,
  style,
  containerStyle,
  ...imgProps
}: ImageProps) {
  const needsDimensionFetch = !width && !height && src && !isExternal(src);
  const fetchedDimensions = needsDimensionFetch ? use(fetchDimensions(src)) : null;

  const imageDimensions = {
    width: width ? Number(width) : fetchedDimensions?.width,
    height: height ? Number(height) : fetchedDimensions?.height,
  };
  const imageError = needsDimensionFetch && !fetchedDimensions;
  const [loadingComplete, setLoadingComplete] = useState(false);

  const useResponsive = !unoptimized && !isExternal(src);

  const classes = clsx(
    "image",
    !loadingComplete ? "image--loading" : "",
    imageError ? "image--error" : "",
    className,
  );

  const imgStyle = fill
    ? {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        ...style,
      }
    : style;

  const wrapperStyle = fill
    ? {
        position: "relative" as const,
        width: "100%",
        height: "100%",
        ...containerStyle,
      }
    : containerStyle;

  return (
    <div className={classes} style={wrapperStyle}>
      <picture style={fill ? { display: "block", width: "100%", height: "100%" } : undefined}>
        {useResponsive && (
          <>
            <source type="image/avif" srcSet={buildSrcSet(src, "avif")} sizes={sizes} />
            <source type="image/webp" srcSet={buildSrcSet(src, "webp")} sizes={sizes} />
          </>
        )}
        <img
          {...imgProps}
          src={buildSrc(src, imageDimensions?.width)}
          srcSet={useResponsive ? buildSrcSet(src) : undefined}
          sizes={useResponsive ? sizes : undefined}
          alt={alt}
          width={fill ? undefined : imageDimensions?.width}
          height={fill ? undefined : imageDimensions?.height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : undefined}
          className={clsx("image__img", imgClassName)}
          style={imgStyle}
          onError={() => setLoadingComplete(true)}
          onLoad={() => setLoadingComplete(true)}
        />
      </picture>
    </div>
  );
}
