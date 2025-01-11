import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import type { ExecutionContext } from "@cloudflare/workers-types";
import PostalMime from "postal-mime";

import type { Env, SiteVerify } from "./types";

export default {
	async fetch(request: Request, env: Env) {
		const method = request.method;

		if (method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		const ip = request.headers.get("cf-connecting-ip");

		const formData = await request.formData();

		const token = formData.get("token") as string;
		const from = formData.get("from") as string;
		const subject = formData.get("subject") as string;
		const body = formData.get("body") as string;

		if (!token || !from || !subject || !body) {
			return new Response("Missing required fields", { status: 400 });
		}

		const validateTokenData = new FormData();
		validateTokenData.set("secret", env.TURNSTILE_SECRET_KEY);
		validateTokenData.set("response", token);
		if (ip !== null && ip !== undefined) {
			validateTokenData.set("ip", ip);
		}

		const validateTokenUrl =
			"https://challenges.cloudflare.com/turnstile/v0/siteverify";
		const validateTokenResponse = await fetch(validateTokenUrl, {
			body: validateTokenData,
			method: "POST",
		});

		const validateTokenOutcome =
			(await validateTokenResponse.json()) as SiteVerify;
		if (!validateTokenOutcome.success) {
			return new Response("Invalid token", { status: 400 });
		}

		try {
			const msg = createMimeMessage();
			msg.setSender({ name: "Contact Form Submission", addr: from });
			msg.setRecipient(env.FORWARD_TO);
			msg.setSubject(subject);
			msg.addMessage({
				contentType: "text/plain",
				data: body,
			});

			const message = new EmailMessage(
				from,
				env.FORWARD_TO,
				msg.asRaw(),
			);

			await env.EMAIL.send(message);
		} catch (e) {
			if (e instanceof Error) {
				return new Response(e.message, { status: 500 });
			}

			return new Response("Internal server error", { status: 500 });
		}
	},
	async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
		const blockList: string[] = [];

		if (blockList.includes(message.from)) {
			// @ts-ignore - types seem to be wrong
			message.setReject("Address is blocked");
			return;
		}

		const parser = new PostalMime();

		// @ts-ignore - types seem to be wrong
		const rawEmail = new Response(message.raw);
		const email = await parser.parse(await rawEmail.arrayBuffer());

		console.log(email);

		if (env.R2_BUCKET) {
			const date = new Date().toISOString();
			const emailId = `${date}-${email.from.address}`;

			const attachments = email.attachments;

			const attachmentPromises = attachments.map(async (attachment) => {
				const attachmentId = `${emailId}/${attachment.filename}`;
				await env.R2_BUCKET.put(attachmentId, attachment.content);
			});

			await Promise.all(attachmentPromises);

			await env.R2_BUCKET.put(`${emailId}/email.json`, JSON.stringify(email));
		}

		// @ts-ignore - types seem to be wrong
		await message.forward(env.FORWARD_TO);
	},
};
