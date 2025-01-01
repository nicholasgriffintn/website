export const hexToRgb = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result?.[1] || !result?.[2] || !result?.[3]) return null;
	return {
		r: Number.parseInt(result[1], 16),
		g: Number.parseInt(result[2], 16),
		b: Number.parseInt(result[3], 16),
	};
};

export const getImageUrl = (key: string) => {
	return `https://assistant-assets.nickgriffin.uk/${key}`;
};

export const floodFill = (
	imageData: ImageData,
	startX: number,
	startY: number,
	fillColor: string,
) => {
	const pixels = imageData.data;
	const width = imageData.width;
	const height = imageData.height;

	const fillRGB = hexToRgb(fillColor);
	if (!fillRGB) return;

	const startPos = (startY * width + startX) * 4;
	const startR = pixels[startPos];
	const startG = pixels[startPos + 1];
	const startB = pixels[startPos + 2];

	if (startR === fillRGB.r && startG === fillRGB.g && startB === fillRGB.b) {
		return;
	}

	const stack: [number, number][] = [[startX, startY]];

	while (stack.length) {
		const [x, y] = stack.pop()!;
		const pos = (y * width + x) * 4;

		if (x < 0 || x >= width || y < 0 || y >= height) continue;
		if (
			pixels[pos] !== startR ||
			pixels[pos + 1] !== startG ||
			pixels[pos + 2] !== startB
		)
			continue;

		pixels[pos] = fillRGB.r;
		pixels[pos + 1] = fillRGB.g;
		pixels[pos + 2] = fillRGB.b;
		pixels[pos + 3] = 255;

		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}
};
