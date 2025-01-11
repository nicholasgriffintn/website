import type { EmailMessage, ExecutionContext } from "@cloudflare/workers-types";
import PostalMime from "postal-mime";

import type { Env } from "./types";

export default {
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
    const blockList: string[]= [];

    if (blockList.includes(message.from)) {
      // @ts-ignore - types seem to be wrong
      message.setReject("Address is blocked");
      return;
    }

    const parser = new PostalMime();

    // @ts-ignore - types seem to be wrong
    const rawEmail = new Response(message.raw)
    const email = await parser.parse(await rawEmail.arrayBuffer())

    console.log(email)

    if (env.R2_BUCKET) {
      const date = new Date().toISOString()
      const emailId = `${date}-${email.from.address}`

      const attachments = email.attachments;

      const attachmentPromises = attachments.map(async (attachment) => {
        const attachmentId = `${emailId}/${attachment.filename}`
        await env.R2_BUCKET.put(attachmentId, attachment.content)
      })

      await Promise.all(attachmentPromises)

      await env.R2_BUCKET.put(`${emailId}/email.json`, JSON.stringify(email))
    }

    // @ts-ignore - types seem to be wrong
    await message.forward(env.FORWARD_TO);
  }
}