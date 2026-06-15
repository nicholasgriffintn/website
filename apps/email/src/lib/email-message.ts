import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export type PlainEmail = {
  senderName: string;
  from: string;
  to: string;
  subject: string;
  text: string;
};

export function createPlainEmail(input: PlainEmail): EmailMessage {
  const msg = createMimeMessage();
  msg.setSender({
    name: input.senderName,
    addr: input.from,
  });
  msg.setRecipient(input.to);
  msg.setSubject(input.subject);
  msg.addMessage({
    contentType: "text/plain",
    data: input.text,
  });

  return new EmailMessage(input.from, input.to, msg.asRaw());
}

export function createRawPlainEmail(input: PlainEmail): { message: EmailMessage; raw: string } {
  const msg = createMimeMessage();
  msg.setSender({
    name: input.senderName,
    addr: input.from,
  });
  msg.setRecipient(input.to);
  msg.setSubject(input.subject);
  msg.addMessage({
    contentType: "text/plain",
    data: input.text,
  });

  const raw = msg.asRaw();
  return { message: new EmailMessage(input.from, input.to, raw), raw };
}
