export async function onGenerateDrawing(drawingData: string) {
	try {
		const token = process.env.AUTH_TOKEN;
		if (!token) {
			throw new Error("No token set");
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://chat-api.nickgriffin.uk";

		const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
		const binaryData = Buffer.from(base64Data, "base64");
		const blob = new Blob([binaryData], { type: "image/png" });

		const formData = new FormData();
		formData.append("drawing", blob, "drawing.png");

		const res = await fetch(`${baseUrl}/apps/drawing`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"User-Agent": "NGWeb",
				"x-user-email": "anonymous@undefined.computer",
			},
			body: formData,
		});

		if (!res.ok) {
			console.error("Failed to submit drawing", res);
			throw new Error("Failed to submit drawing");
		}

		const data = await res.json();
		return data;
	} catch (error) {
		console.error("Error generating drawing", error);
		throw new Error("Error generating drawing");
	}
}