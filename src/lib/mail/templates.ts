import { siteConfig } from "@/lib/site";
import type { CustomerCare } from "@/lib/env";
import type { EmailMessage } from "./mailer";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function bookingRequestEmail(opts: {
  to: string;
  name: string;
  reference: string;
  flight: string;
  passengers: string;
  price: string;
  expiresAt: string;
  care: CustomerCare;
  links: { whatsapp?: string; phone?: string; email?: string };
}): EmailMessage {
  const { care, links } = opts;
  const url = `${siteConfig.url}/booking/lookup?ref=${encodeURIComponent(opts.reference)}`;
  const subject = `Your Fareway request ${opts.reference} is saved`;
  const contactText = [
    care.whatsapp && `WhatsApp: +${care.whatsapp}`,
    care.phone && `Phone: ${care.phone}`,
    care.email && `Email: ${care.email}`,
    care.hours && `Hours: ${care.hours}`,
  ]
    .filter(Boolean)
    .join("\n");

  const text = `Hello ${opts.name},

Your request is saved. To confirm your booking and pay, contact our customer care team and quote your reference number.

Reference: ${opts.reference}
Flight: ${opts.flight}
Travellers: ${opts.passengers}
Indicative price: ${opts.price}
Status: Pending (held until ${opts.expiresAt})

${contactText}

Prices are indicative and are confirmed by customer care before payment. Your booking is only confirmed after payment is completed through customer care. We never ask for card details by email.

View your request: ${url}

Fareway`;

  const button = (href: string | undefined, label: string, bg: string, color = "#ffffff") =>
    href
      ? `<a href="${esc(href)}" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 18px;border-radius:12px;background:${bg};color:${color};font-weight:600;text-decoration:none">${label}</a>`
      : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f6f9fc;font-family:Inter,Arial,sans-serif;color:#0f1b2d">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:20px;font-weight:800;color:#0b3d91;margin:0 0 16px">Fareway</p>
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    <p style="margin:0 0 12px">Hello ${esc(opts.name)},</p>
    <p style="margin:0 0 16px;font-weight:600">Your request is saved. To confirm your booking and pay, contact our customer care team and quote your reference number.</p>
    <p style="margin:0 0 4px;font-size:12px;color:#4f5d72;text-transform:uppercase;letter-spacing:.06em">Reference</p>
    <p style="margin:0 0 16px;font-size:26px;font-weight:800;letter-spacing:.04em">${esc(opts.reference)}</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#4f5d72;vertical-align:top">Flight</td><td style="padding:6px 0">${esc(opts.flight)}</td></tr>
      <tr><td style="padding:6px 0;color:#4f5d72">Travellers</td><td style="padding:6px 0">${esc(opts.passengers)}</td></tr>
      <tr><td style="padding:6px 0;color:#4f5d72">Indicative price</td><td style="padding:6px 0;font-weight:700;color:#b8460f">${esc(opts.price)}</td></tr>
      <tr><td style="padding:6px 0;color:#4f5d72">Status</td><td style="padding:6px 0">Pending, held until ${esc(opts.expiresAt)}</td></tr>
    </table>
    <div style="margin:20px 0 8px">
      ${button(links.whatsapp, "WhatsApp us", "#1e9e5a")}
      ${button(links.phone, "Call us", "#0b3d91")}
      ${button(links.email, "Email us", "#ff7a3d", "#0f1b2d")}
    </div>
    ${care.hours ? `<p style="font-size:13px;color:#4f5d72;margin:8px 0 0">Customer care hours: ${esc(care.hours)}. ${esc(care.responseTime)}</p>` : ""}
    <p style="font-size:13px;background:#ebf6ff;color:#0b3d91;border-radius:12px;padding:12px;margin:20px 0 0">Prices are indicative and are confirmed by customer care before payment. Your booking is only confirmed after payment is completed through customer care. We never ask for card details by email.</p>
    <p style="font-size:13px;margin:16px 0 0"><a href="${esc(url)}" style="color:#0a66b8">View your request online</a></p>
  </div>
</div></body></html>`;

  return { to: opts.to, subject, text, html, replyTo: care.email || undefined };
}
