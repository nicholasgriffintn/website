import PostalMime from "postal-mime";
import type { Env } from "../types";

const blockList: string[] = [];

export async function handleInboundEmail(
  message: ForwardableEmailMessage,
  env: Env,
): Promise<void> {
  if (blockList.includes(message.from)) {
    message.setReject("Address is blocked");
    return;
  }

  const parser = new PostalMime();
  const rawEmail = new Response(message.raw);
  const email = await parser.parse(await rawEmail.arrayBuffer());

  if (env.R2_BUCKET) {
    const date = new Date().toISOString();
    if (!email.from?.address) {
      console.error("Email is missing 'from' address");
      return;
    }

    const emailId = `${date}-${email.from.address}`;
    await Promise.all(
      email.attachments.map(async (attachment) => {
        await env.R2_BUCKET.put(`${emailId}/${attachment.filename}`, attachment.content);
      }),
    );

    await env.R2_BUCKET.put(`${emailId}/email.json`, JSON.stringify(email));
  }

  await message.forward(env.FORWARD_TO);
}
