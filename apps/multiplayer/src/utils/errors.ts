export class AppError extends Error {
	constructor(
		public message: string,
		public statusCode = 500,
		public code?: string,
	) {
		super(message);
	}
}

export function handleApiError(err: Error) {
	console.error("Unhandled error");
	console.error(err);
	const status = err instanceof AppError ? err.statusCode : 500;
	return new Response(err.message, { status });
}
