import { exceedsCloudflareAnimatedImageLimit, getImageAnimationInfo } from "./animation";

runTest("detects a GIF animation that exceeds Cloudflare's total frame area limit", () => {
  const image = createGif(1280, 821, 96);
  const info = getImageAnimationInfo(image.buffer);

  assertDeepEqual(info, { format: "gif", width: 1280, height: 821, frames: 96 });
  assertEqual(info && exceedsCloudflareAnimatedImageLimit(info), true);
});

runTest(
  "keeps a GIF animation below Cloudflare's total frame area limit eligible for resizing",
  () => {
    const image = createGif(1280, 821, 95);
    const info = getImageAnimationInfo(image.buffer);

    assertDeepEqual(info, { format: "gif", width: 1280, height: 821, frames: 95 });
    assertEqual(info && exceedsCloudflareAnimatedImageLimit(info), false);
  },
);

runTest("detects an animated WebP that exceeds Cloudflare's total frame area limit", () => {
  const image = createAnimatedWebp(1280, 821, 96);
  const info = getImageAnimationInfo(image.buffer);

  assertDeepEqual(info, { format: "webp", width: 1280, height: 821, frames: 96 });
  assertEqual(info && exceedsCloudflareAnimatedImageLimit(info), true);
});

runTest("ignores static WebP files", () => {
  const image = createStaticWebp(1280, 821);

  assertEqual(getImageAnimationInfo(image.buffer), null);
});

function runTest(name: string, test: () => void): void {
  try {
    test();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function assertEqual(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, got ${actualJson}`);
  }
}

function createGif(width: number, height: number, frames: number): Uint8Array {
  const bytes = [...ascii("GIF89a"), ...uint16LE(width), ...uint16LE(height), 0, 0, 0];

  for (let frame = 0; frame < frames; frame += 1) {
    bytes.push(
      0x2c,
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint16LE(width),
      ...uint16LE(height),
      0,
      2,
      2,
      0x4c,
      0x01,
      0,
    );
  }

  bytes.push(0x3b);

  return new Uint8Array(bytes);
}

function createAnimatedWebp(width: number, height: number, frames: number): Uint8Array {
  const chunks = [
    createChunk("VP8X", [0x02, 0, 0, 0, ...uint24LE(width - 1), ...uint24LE(height - 1)]),
    createChunk("ANIM", [0, 0, 0, 0, 0, 0]),
  ];

  for (let frame = 0; frame < frames; frame += 1) {
    chunks.push(
      createChunk(
        "ANMF",
        Array.from({ length: 16 }, () => 0),
      ),
    );
  }

  return createRiff(chunks);
}

function createStaticWebp(width: number, height: number): Uint8Array {
  return createRiff([
    createChunk("VP8X", [0, 0, 0, 0, ...uint24LE(width - 1), ...uint24LE(height - 1)]),
  ]);
}

function createRiff(chunks: number[][]): Uint8Array {
  const body = [...ascii("WEBP"), ...chunks.flat()];

  return new Uint8Array([...ascii("RIFF"), ...uint32LE(body.length), ...body]);
}

function createChunk(type: string, data: number[]): number[] {
  return [...ascii(type), ...uint32LE(data.length), ...data, ...(data.length % 2 ? [0] : [])];
}

function ascii(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0));
}

function uint16LE(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

function uint24LE(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff];
}

function uint32LE(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
}
