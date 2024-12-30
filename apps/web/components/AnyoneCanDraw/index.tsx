"use client";

import { useState } from "react";

import { DrawingCanvas } from "@/components/DrawingCanvas";
import { onGenerateDrawing } from "@/actions/chat";
import type { User as DBUser } from "@/types/auth";

export function AnyoneCanDraw({
	user,
}: {
	user: DBUser;
}) {
	const [result, setResult] = useState<string | null>(null);

	const handleSubmit = async (drawingData: string): Promise<any> => {
		try {
			const data = await onGenerateDrawing(drawingData);
			setResult(data as string);
			return data as any;
		} catch (error) {
			console.error("Error submitting drawing:", error);
			throw error;
		}
	};

	return (
		<DrawingCanvas user={user} onSubmit={handleSubmit} result={result} gameMode={true} />
	);
}
