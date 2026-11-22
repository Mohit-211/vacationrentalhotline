import "server-only";
import { formatPrice } from "@/lib/pricing";
import { serverEnv } from "@/server/env";
import type { EmailMessage } from "./send";

// Transactional emails. Each has an HTML version (inline styles, since email
// clients ignore stylesheets) and a plain-text version. Colours are the
// site's tokens from globals.css, written out because email can't read them.

const colors = {
  canvas: "#f4f7fa",
  surface: "#fbfcfd",
  border: "#d6dde5",
  foreground: "#0f1b2d",
  muted: "#4c5869",
  primaryStrong: "#006faa",
  onStrong: "#fbfcfd",
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

interface Layout {
  to: string;
  subject: string;
  heading: string;
  /** Plain-text paragraphs; escaped for the HTML version. */
  paragraphs: string[];
  /** A short list shown after the paragraphs, such as the properties a payment covered. */
  list?: string[];
  action?: { label: string; url: string };
  /** Small print under the button. */
  footnote?: string;
}

function render({ to, subject, heading, paragraphs, list, action, footnote }: Layout): EmailMessage {
  const siteUrl = serverEnv().APP_URL;
  const paragraph = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${colors.foreground}">${escapeHtml(text)}</p>`;
  const button = action
    ? `<p style="margin:24px 0">
        <a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:${colors.primaryStrong};color:${colors.onStrong};font-size:16px;font-weight:600;text-decoration:none">${escapeHtml(action.label)}</a>
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.muted}">If the button doesn't work, copy this link into your browser:<br><a href="${escapeHtml(action.url)}" style="color:${colors.primaryStrong};word-break:break-all">${escapeHtml(action.url)}</a></p>`
    : "";
  const listHtml = list?.length
    ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;color:${colors.foreground}">${list
        .map((item) => `<li style="margin:0 0 6px">${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : "";
  const small = footnote
    ? `<p style="margin:0;font-size:14px;line-height:1.6;color:${colors.muted}">${escapeHtml(footnote)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;padding:0;background:${colors.canvas};font-family:Inter,'Segoe UI',Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.canvas};padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${colors.surface};border:1px solid ${colors.border};border-radius:12px">
          <tr><td style="padding:32px">
            <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:0.02em;color:${colors.primaryStrong}">Vacation Rental Hotline</p>
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${colors.foreground}">${escapeHtml(heading)}</h1>
            ${paragraphs.map(paragraph).join("\n            ")}
            ${listHtml}
            ${button}
            ${small}
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:${colors.muted}">Vacation Rental Hotline · <a href="${escapeHtml(siteUrl)}" style="color:${colors.muted}">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    heading,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...(list?.length ? [...list.map((item) => `- ${item}`), ""] : []),
    ...(action ? [`${action.label}: ${action.url}`, ""] : []),
    ...(footnote ? [footnote, ""] : []),
    `Vacation Rental Hotline · ${siteUrl}`,
  ].join("\n");

  return { to, subject, html, text };
}

const greeting = (name: string) => `Hi ${name.trim() || "there"},`;

export function verifyEmailMessage(to: string, name: string, url: string): EmailMessage {
  return render({
    to,
    subject: "Verify your email address for Vacation Rental Hotline",
    heading: "Verify your email address",
    paragraphs: [
      greeting(name),
      "Thanks for signing up for Vacation Rental Hotline. Please confirm your email address to activate your account.",
    ],
    action: { label: "Verify email address", url },
    footnote:
      "This link expires in 12 hours, after which the unverified account is removed and you can sign up again. If you didn't create an account, you can ignore this email.",
  });
}

export function welcomeMessage(to: string, name: string): EmailMessage {
  return render({
    to,
    subject: "Welcome to Vacation Rental Hotline!",
    heading: "Welcome to Vacation Rental Hotline",
    paragraphs: [
      greeting(name),
      "Your email address is verified. You can now sign in, add your properties and choose the ones you'd like us to cover.",
    ],
    action: { label: "Sign in", url: `${serverEnv().APP_URL}/login` },
  });
}

export function resetPasswordMessage(to: string, name: string, url: string): EmailMessage {
  return render({
    to,
    subject: "Reset your password for Vacation Rental Hotline",
    heading: "Reset your password",
    paragraphs: [
      greeting(name),
      "We received a request to reset the password for your Vacation Rental Hotline account. Use the button below to choose a new one.",
    ],
    action: { label: "Reset password", url },
    footnote:
      "This link expires in 1 hour and works once. If you didn't ask to reset your password, you can ignore this email; your password won't change.",
  });
}

export function passwordChangedMessage(to: string, name: string): EmailMessage {
  return render({
    to,
    subject: "Your password has been changed",
    heading: "Your password has been changed",
    paragraphs: [
      greeting(name),
      "The password for your Vacation Rental Hotline account was just changed. If you made this change, there's nothing else to do.",
      "If you didn't, reset your password right away and let us know.",
    ],
    action: { label: "Reset password", url: `${serverEnv().APP_URL}/forgot-password` },
  });
}

export function verifyNewEmailMessage(to: string, name: string, url: string): EmailMessage {
  return render({
    to,
    subject: "Verify your new email address",
    heading: "Confirm your new email address",
    paragraphs: [
      greeting(name),
      "You asked to change the email address on your Vacation Rental Hotline account to this one. Confirm the change with the button below.",
    ],
    action: { label: "Confirm new email address", url },
    footnote:
      "This link expires in 12 hours. If you didn't ask for this change, ignore this email and your account keeps its current address.",
  });
}

export function emailChangedMessage(to: string, name: string, newEmail: string): EmailMessage {
  return render({
    to,
    subject: "Your email address has been changed",
    heading: "Your email address has been changed",
    paragraphs: [
      greeting(name),
      `The email address on your Vacation Rental Hotline account is now ${newEmail}. Use it the next time you sign in.`,
      "If you didn't make this change, contact us right away.",
    ],
  });
}

const longDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export interface ReceiptDetails {
  amountCents: number;
  /** A yearly renewal rather than a first purchase. */
  renewal: boolean;
  receiptUrl: string | null;
  items: { label: string; amountCents: number; paidThrough: Date; renews: boolean }[];
}

export function receiptMessage(to: string, name: string, receipt: ReceiptDetails): EmailMessage {
  const renews = receipt.items.some((item) => item.renews);
  return render({
    to,
    subject: receipt.renewal
      ? "Your Vacation Rental Hotline cover has renewed: here's your receipt"
      : "Thank you for your payment: here's your receipt",
    heading: receipt.renewal ? "Your cover has renewed" : "Thank you for your payment",
    paragraphs: [
      greeting(name),
      `We received your payment of ${formatPrice(receipt.amountCents)}. These properties are covered:`,
    ],
    list: receipt.items.map(
      (item) => `${item.label}: ${formatPrice(item.amountCents)}, covered until ${longDate(item.paidThrough)}`,
    ),
    action: receipt.receiptUrl ? { label: "View receipt", url: receipt.receiptUrl } : undefined,
    footnote: renews
      ? "Cover renews automatically each year at the same price. To stop a renewal, open the property in your dashboard and choose Cancel renewal; it stays covered until the date above."
      : undefined,
  });
}

export interface EndedCover {
  label: string;
  endedAt: Date;
}

export function coverEndedMessage(to: string, name: string, items: EndedCover[]): EmailMessage {
  return render({
    to,
    subject: "Your Vacation Rental Hotline cover has ended",
    heading: "Your hotline cover has ended",
    paragraphs: [
      greeting(name),
      `We no longer answer calls for ${items.length === 1 ? "this property" : "these properties"}:`,
    ],
    list: items.map((item) => `${item.label} (ended ${longDate(item.endedAt)})`),
    action: { label: "Renew in your dashboard", url: `${serverEnv().APP_URL}/dashboard` },
    footnote: "If you think this is a mistake, reply to this email or call us.",
  });
}

export function staffCoverEndedMessage(
  to: string,
  customer: { name: string; email: string },
  items: EndedCover[],
): EmailMessage {
  return render({
    to,
    subject: `Cover ended: ${customer.name} (${items.length} ${items.length === 1 ? "property" : "properties"})`,
    heading: "A customer's cover has ended",
    paragraphs: [`Hotline cover has ended for ${customer.name} (${customer.email}):`],
    list: items.map((item) => `${item.label} (ended ${longDate(item.endedAt)})`),
  });
}
