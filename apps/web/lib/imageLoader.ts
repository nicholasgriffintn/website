const normalizeSrc = (src: string) => {
  return src.startsWith("/") ? src : `/${src}`;
};

const IMAGE_SERVICE_URL = import.meta.env.VITE_IMAGE_SERVICE_URL || "https://images.s3rve.co.uk";

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const isExternal = src.startsWith("http");
  if (isExternal) {
    return src;
  }

  const params = new URLSearchParams({
    width: width.toString(),
    image: normalizeSrc(src),
  });

  if (quality) {
    params.set("quality", quality.toString());
  }

  return `${IMAGE_SERVICE_URL}/?${params.toString()}`;
}
