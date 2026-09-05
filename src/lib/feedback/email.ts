import type { FeedbackNotification } from "./submission.ts";

const HEADER_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailBody(feedback: FeedbackNotification): string {
  return [
    `Feedback ID: ${feedback.id}`,
    `Type: ${feedback.type}`,
    `Submitted: ${feedback.createdAt}`,
    `Page: ${feedback.pagePath}`,
    `Browser: ${feedback.browserCategory}`,
    `Device: ${feedback.deviceCategory}`,
    `Reply email: ${feedback.email || "Not provided"}`,
    "",
    feedback.message,
  ].join("\r\n");
}

export async function sendFeedbackEmail(
  binding: SendEmail,
  destination: string,
  feedback: FeedbackNotification,
): Promise<{ id: string }> {
  if (!HEADER_EMAIL.test(destination)) throw new Error("feedback_email_destination_missing");
  const replyTo = feedback.email ? `Reply-To: ${feedback.email}\r\n` : "";
  const raw = [
    "From: HSKKit Feedback <feedback@hskkit.com>",
    `To: ${destination}`,
    replyTo.trimEnd(),
    `Subject: [HSKKit Feedback] ${feedback.type.toUpperCase()}`,
    `Date: ${new Date(feedback.createdAt).toUTCString()}`,
    `Message-ID: <${feedback.id}@hskkit.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    emailBody(feedback),
  ].filter((line, index) => line || index >= 8).join("\r\n");
  const EmailMessage = (globalThis as typeof globalThis & {
    __hskkitEmailMessage?: new (
      from: string,
      to: string,
      raw: string | ReadableStream,
    ) => import("cloudflare:email").EmailMessage;
  }).__hskkitEmailMessage;
  if (!EmailMessage) throw new Error("feedback_email_runtime_missing");
  await binding.send(new EmailMessage("feedback@hskkit.com", destination, raw));
  return { id: `cloudflare-email:${feedback.id}` };
}

export async function hashFeedbackIp(ip: string, secret: string): Promise<string> {
  if (secret.length < 32) throw new Error("feedback_hash_secret_missing");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`hskkit-feedback:${ip}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
