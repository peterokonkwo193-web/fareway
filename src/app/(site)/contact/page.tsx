import type { Metadata } from "next";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { CustomerCarePanel } from "@/components/booking/customer-care";
import { buttonVariants } from "@/components/ui/button";
import { generalContactLinks } from "@/lib/booking/contact-links";
import { customerCare } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact customer care",
  description: "Reach the Fareway customer care team by WhatsApp, phone or email to confirm and pay for your booking request.",
};

export default function ContactPage() {
  const care = customerCare();
  return (
    <div className="container-page max-w-3xl space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contact customer care</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Our team confirms prices, completes bookings and takes payment with you. If you already have a request, have your reference number (it looks like
          FW-261014-AB3CD) ready.
        </p>
      </div>
      <CustomerCarePanel
        links={generalContactLinks(care)}
        phone={care.phone}
        email={care.email}
        whatsapp={care.whatsapp}
        hours={care.hours}
        responseTime={care.responseTime}
      />
      <div className="card-surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold">Already sent a request?</h2>
          <p className="text-sm text-muted-foreground">See its status and contact options with your reference and email.</p>
        </div>
        <Link href="/booking/lookup" className={buttonVariants({ variant: "brand", size: "lg" })}>
          <Ticket className="size-4" aria-hidden="true" />
          Find my booking
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        For your safety: we never ask for card details by email, WhatsApp or on this website. Payment is arranged directly with customer care.
      </p>
    </div>
  );
}
