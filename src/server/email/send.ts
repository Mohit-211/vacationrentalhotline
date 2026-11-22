import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { serverEnv } from "@/server/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | undefined;

function smtpTransporter(): Transporter {
  if (!transporter) {
    const env = serverEnv();
    const secure = env.SMTP_PORT === 465;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // Port 465 is TLS from the start; anything else must upgrade with STARTTLS.
      secure,
      requireTLS: !secure,
      auth: env.SMTP_USERNAME ? { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/** Sends an email, or prints it to the console when MAIL_TRANSPORT is "log". */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const env = serverEnv();
  if (env.MAIL_TRANSPORT === "log") {
    // On a live server this is almost always a leftover setting, so say so.
    if (env.NODE_ENV === "production") {
      console.warn('[email] Not sent: MAIL_TRANSPORT is "log". Set it to "smtp" (or leave it empty) to send email.');
    }
    console.info(`[email] To: ${message.to}\n[email] Subject: ${message.subject}\n${message.text}\n[email] ---`);
    return;
  }
  await smtpTransporter().sendMail({ from: env.EMAIL_FROM, ...message });
}

/**
 * Sends an email without making the request wait for the mail server, and
 * logs a failure instead of failing the request. Used for messages whose
 * timing must not reveal whether an account exists.
 */
export function sendEmailInBackground(message: EmailMessage): void {
  sendEmail(message).catch((error: unknown) => {
    console.error(`[email] Failed to send "${message.subject}" to ${message.to}`, error);
  });
}
