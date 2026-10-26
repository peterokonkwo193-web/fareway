import type { CustomerCare } from "@/lib/env";

export type ContactLinks = { whatsapp?: string; phone?: string; email?: string };

/** Prefilled links so customers reach care with their reference ready. */
export function buildContactLinks(care: CustomerCare, reference: string, summary: string): ContactLinks {
  const message = `Hello Fareway, I would like to confirm and pay for my booking request ${reference}. Flight: ${summary}`;
  return {
    whatsapp: care.whatsapp ? `https://wa.me/${care.whatsapp}?text=${encodeURIComponent(message)}` : undefined,
    phone: care.phone ? `tel:${care.phone.replace(/[^\d+]/g, "")}` : undefined,
    email: care.email
      ? `mailto:${care.email}?subject=${encodeURIComponent(`Booking request ${reference}`)}&body=${encodeURIComponent(`${message}\n\nName:\nBest time to call:\n`)}`
      : undefined,
  };
}

/** Contact links for general enquiries (no booking reference yet). */
export function generalContactLinks(care: CustomerCare): ContactLinks {
  const message = "Hello Fareway, I have a question about a flight.";
  return {
    whatsapp: care.whatsapp ? `https://wa.me/${care.whatsapp}?text=${encodeURIComponent(message)}` : undefined,
    phone: care.phone ? `tel:${care.phone.replace(/[^\d+]/g, "")}` : undefined,
    email: care.email ? `mailto:${care.email}?subject=${encodeURIComponent("Question for Fareway customer care")}` : undefined,
  };
}
