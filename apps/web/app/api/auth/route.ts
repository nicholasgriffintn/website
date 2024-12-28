import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * @deprecated Use the new login methods instead
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const token = searchParams.get("token") as string | "";
	const redirectPath = searchParams.get("redirect") as string | "/";

	if (token) {
		const cookieStore = await cookies();
		cookieStore.set("authToken", token, {
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
	}

	redirect(redirectPath);
}
