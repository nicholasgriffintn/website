export type ImageOptions = RequestInit<RequestInitCfProperties> & {
  cf: {
    image: RequestInitCfPropertiesImage;
  };
};

export function getImageOptions(request: Request, searchParams: URLSearchParams): ImageOptions {
  const image: RequestInitCfPropertiesImage = {};
  const options: ImageOptions = { cf: { image } };

  if (searchParams.get("format") === "json") {
    image.format = "json";
    image.anim = false;
    return options;
  }

  const accept = request.headers.get("Accept");
  if (accept?.includes("image/avif")) {
    image.format = "avif";
  } else if (accept?.includes("image/webp")) {
    image.format = "webp";
  }

  const fit = searchParams.get("fit");
  if (isImageFit(fit)) image.fit = fit;

  const width = getPositiveIntegerParam(searchParams, "width");
  if (width !== null) image.width = width;

  const height = getPositiveIntegerParam(searchParams, "height");
  if (height !== null) image.height = height;

  const quality = getPositiveIntegerParam(searchParams, "quality");
  if (quality !== null) image.quality = quality;

  return options;
}

function isImageFit(
  value: string | null,
): value is NonNullable<RequestInitCfPropertiesImage["fit"]> {
  return (
    value === "scale-down" ||
    value === "contain" ||
    value === "cover" ||
    value === "crop" ||
    value === "pad" ||
    value === "squeeze"
  );
}

function getPositiveIntegerParam(searchParams: URLSearchParams, name: string): number | null {
  const value = searchParams.get(name);
  if (!value) return null;

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}
