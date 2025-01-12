import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import type { ExecutionContext } from "@cloudflare/workers-types";
import PostalMime from "postal-mime";

import type { Env, SiteVerify } from "./types";

const blockList: string[] = [];

export default {
	async fetch(request: Request, env: Env) {
		const corsHeaders = {
			"Access-Control-Allow-Origin": "https://nicholasgriffin.dev",
			"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
			"Access-Control-Max-Age": "86400",
		};
		const method = request.method;

		if (method === "OPTIONS") {
			if (
				request.headers.get("Origin") &&
				request.headers.get("Access-Control-Request-Method") &&
				request.headers.get("Access-Control-Request-Headers")
			) {
				// Handle CORS preflight requests.
				return Response.json({ ok: true }, { headers: corsHeaders });
			}

			return Response.json({ ok: true }, { headers: corsHeaders });
		}

		if (method !== "POST") {
			return Response.json(
				{ ok: false },
				{ status: 405, headers: corsHeaders },
			);
		}

		const ip = request.headers.get("cf-connecting-ip");

		const formData = await request.formData();

		const token = formData.get("cf-turnstile-response") as string;
		const from = formData.get("from") as string;
		const subject = formData.get("subject") as string;
		const body = formData.get("body") as string;

		if (!token || !from || !subject || !body) {
			console.log("Missing required fields");
			return Response.json(
				{ ok: false },
				{ status: 400, headers: corsHeaders },
			);
		}

		if (blockList.includes(from)) {
			return Response.json(
				{ ok: false },
				{ status: 400, headers: corsHeaders },
			);
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
			console.log("Invalid token");
			return Response.json(
				{ ok: false },
				{ status: 400, headers: corsHeaders },
			);
		}

		const msg = createMimeMessage();
		msg.setSender({
			name: "Contact Form Submission",
			addr: "contact@nickgriffin.uk",
		});
		msg.setRecipient(env.FORWARD_TO);
		msg.setSubject(subject);
		msg.addMessage({
			contentType: "text/plain",
			data: `
From: ${from}
Subject: ${subject}

Message:
${body}
`,
		});

		try {
			const message = new EmailMessage(
				"contact@nickgriffin.uk",
				env.FORWARD_TO,
				msg.asRaw(),
			);

			await env.EMAIL.send(message);

			if (env.R2_BUCKET) {
				const date = new Date().toISOString();
				const emailId = `${date}-${from}`;

				await env.R2_BUCKET.put(`${emailId}/email.json`, JSON.stringify({
						from,
						subject,
						message: msg.asRaw(),
					}),
				);
			}
		} catch (e) {
			console.error("Error sending email", e);
			if (e instanceof Error) {
				return Response.json(
					{ ok: false },
					{ status: 500, headers: corsHeaders },
				);
			}

			return Response.json(
				{ ok: false },
				{ status: 500, headers: corsHeaders },
			);
		}

		return Response.json({ ok: true }, { status: 200, headers: corsHeaders });
	},
	async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
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
