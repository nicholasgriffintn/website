export type ImageAnimationInfo = {
  format: "gif" | "webp";
  width: number;
  height: number;
  frames: number;
};

export const CLOUDFLARE_ANIMATED_IMAGE_AREA_LIMIT = 100_000_000;

export function getImageAnimationInfo(bytes: ArrayBufferLike): ImageAnimationInfo | null {
  const data = new Uint8Array(bytes);

  return getGifAnimationInfo(data) ?? getWebpAnimationInfo(data);
}

export function exceedsCloudflareAnimatedImageLimit(info: ImageAnimationInfo): boolean {
  const totalFrameArea = BigInt(info.width) * BigInt(info.height) * BigInt(info.frames);

  return info.frames > 1 && totalFrameArea >= BigInt(CLOUDFLARE_ANIMATED_IMAGE_AREA_LIMIT);
}

function getGifAnimationInfo(data: Uint8Array): ImageAnimationInfo | null {
  if (data.length < 13 || (!matchesAscii(data, 0, "GIF87a") && !matchesAscii(data, 0, "GIF89a"))) {
    return null;
  }

  const width = readUint16LE(data, 6);
  const height = readUint16LE(data, 8);
  if (width === 0 || height === 0) return null;

  let offset = 13;
  const globalColorTableSize = getColorTableSize(data[10]);
  if (globalColorTableSize) offset += globalColorTableSize;

  let frames = 0;

  while (offset < data.length) {
    const blockType = data[offset];
    offset += 1;

    if (blockType === 0x3b) {
      return { format: "gif", width, height, frames };
    }

    if (blockType === 0x21) {
      offset += 1;
      const nextOffset = skipGifDataSubBlocks(data, offset);
      if (nextOffset === null) return null;
      offset = nextOffset;
      continue;
    }

    if (blockType === 0x2c) {
      if (offset + 9 > data.length) return null;

      frames += 1;
      const packedFields = data[offset + 8];
      offset += 9;

      const localColorTableSize = getColorTableSize(packedFields);
      if (localColorTableSize) offset += localColorTableSize;
      if (offset >= data.length) return null;

      offset += 1;
      const nextOffset = skipGifDataSubBlocks(data, offset);
      if (nextOffset === null) return null;
      offset = nextOffset;
      continue;
    }

    return null;
  }

  return null;
}

function getWebpAnimationInfo(data: Uint8Array): ImageAnimationInfo | null {
  if (data.length < 12 || !matchesAscii(data, 0, "RIFF") || !matchesAscii(data, 8, "WEBP")) {
    return null;
  }

  let offset = 12;
  let width: number | null = null;
  let height: number | null = null;
  let frames = 0;
  let isAnimated = false;

  while (offset + 8 <= data.length) {
    const chunkType = readAscii(data, offset, 4);
    const chunkSize = readUint32LE(data, offset + 4);
    const chunkDataOffset = offset + 8;
    const chunkEnd = chunkDataOffset + chunkSize;

    if (chunkEnd > data.length) return null;

    if (chunkType === "VP8X") {
      if (chunkSize < 10) return null;

      isAnimated = (data[chunkDataOffset] & 0x02) !== 0;
      width = readUint24LE(data, chunkDataOffset + 4) + 1;
      height = readUint24LE(data, chunkDataOffset + 7) + 1;
    } else if (chunkType === "ANMF") {
      frames += 1;
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!isAnimated || width === null || height === null || width === 0 || height === 0) {
    return null;
  }

  return { format: "webp", width, height, frames };
}

function getColorTableSize(packedFields: number): number {
  if ((packedFields & 0x80) === 0) return 0;

  return 3 * 2 ** ((packedFields & 0x07) + 1);
}

function skipGifDataSubBlocks(data: Uint8Array, offset: number): number | null {
  while (offset < data.length) {
    const blockSize = data[offset];
    offset += 1;

    if (blockSize === 0) return offset;

    offset += blockSize;
    if (offset > data.length) return null;
  }

  return null;
}

function matchesAscii(data: Uint8Array, offset: number, value: string): boolean {
  if (offset + value.length > data.length) return false;

  for (let index = 0; index < value.length; index += 1) {
    if (data[offset + index] !== value.charCodeAt(index)) return false;
  }

  return true;
}

function readAscii(data: Uint8Array, offset: number, length: number): string {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(data[offset + index]);
  }

  return value;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] + data[offset + 1] * 2 ** 8;
}

function readUint24LE(data: Uint8Array, offset: number): number {
  return data[offset] + data[offset + 1] * 2 ** 8 + data[offset + 2] * 2 ** 16;
}

function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] +
    data[offset + 1] * 2 ** 8 +
    data[offset + 2] * 2 ** 16 +
    data[offset + 3] * 2 ** 24
  );
}
