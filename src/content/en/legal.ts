/**
 * Long-form page content (English). Add src/content/<locale>/legal.ts for other
 * languages and register it in src/content/index.ts.
 *
 * NOTE: These texts are a plain-language starting point written for Fareway's
 * request-only booking model. Have them reviewed by a lawyer in your jurisdiction
 * and fill in the company details before launch.
 */

export type Section = { id: string; title: string; body: string[] };
export type LongPage = { title: string; intro: string; updated: string; sections: Section[] };

export const terms: LongPage = {
  title: "Terms of use",
  intro:
    "These terms explain how Fareway works. Please read them before you send a booking request. In short: Fareway helps you compare flights and send a request; our customer care team then confirms the price with you and completes the booking and payment.",
  updated: "15 October 2026",
  sections: [
    {
      id: "who-we-are",
      title: "1. Who we are",
      body: [
        "Fareway (\"we\", \"us\") runs this website. Our company name, registered address and registration number are shown on the Contact page. You can reach customer care using the details on that page.",
      ],
    },
    {
      id: "what-we-do",
      title: "2. What Fareway does",
      body: [
        "Fareway lets you search and compare flights between countries, cities and airports worldwide and send a booking request for a flight you choose.",
        "Fareway does not take payment on this website. There is no card form and we never ask for card details through the site, by email or by chat message.",
        "Flight information on the site, including schedules, baggage allowances and prices, is indicative. It may come from sample data or third-party sources and can change at any time.",
      ],
    },
    {
      id: "requests",
      title: "3. Booking requests",
      body: [
        "When you send a booking request we save it with a reference number (for example FW-261014-AB3CD) and email you a copy. A request is not a booking and does not reserve a seat.",
        "To go ahead, contact customer care and quote your reference. We will check availability with the airline, confirm the final price, fare rules and baggage, and explain how to pay.",
        "Requests are held for 48 hours. If you have not been in touch by then, the request expires. You can always search again.",
      ],
    },
    {
      id: "prices-payment",
      title: "4. Prices and payment",
      body: [
        "Prices shown on the site are indicative totals including estimated taxes for the travellers in your search. The final price is the one customer care confirms to you before you pay; it may be higher or lower.",
        "Your booking is only confirmed once payment has been completed through customer care and you have received a booking confirmation from us. Until then, no contract for carriage exists.",
        "Exchange rates used to show prices in other currencies are indicative.",
      ],
    },
    {
      id: "your-details",
      title: "5. Your details",
      body: [
        "You must enter names exactly as shown on each traveller's passport, and correct dates of birth and nationalities. Airlines may refuse boarding or charge for corrections if details are wrong.",
        "You are responsible for passports, visas, transit visas, health requirements and any other travel documents. Customer care can point you to official sources but cannot guarantee entry to any country.",
      ],
    },
    {
      id: "changes",
      title: "6. Changes, cancellations and refunds",
      body: [
        "Once a booking is confirmed, changes and cancellations follow the airline's fare rules, which customer care will explain before you pay. Some fares cannot be changed or refunded.",
        "You can cancel a request that has not been paid at any time by contacting customer care, at no cost.",
      ],
    },
    {
      id: "liability",
      title: "7. Our responsibility",
      body: [
        "We take care to show useful and accurate information but we cannot guarantee that every price, schedule or route on the site is available.",
        "The airline is responsible for operating the flight. Nothing in these terms limits rights you have under consumer law or passenger rights regulations.",
      ],
    },
    {
      id: "use",
      title: "8. Using the site",
      body: [
        "Please do not misuse the site, for example by sending automated requests, false details or by trying to access areas you are not allowed to. We may block requests that look like abuse.",
      ],
    },
    {
      id: "law",
      title: "9. Changes to these terms and governing law",
      body: [
        "We may update these terms. The version shown when you send a request applies to that request. These terms are governed by the laws of the country where Fareway is registered, without affecting your rights under the consumer laws of the country where you live.",
      ],
    },
  ],
};

export const privacy: LongPage = {
  title: "Privacy policy",
  intro:
    "This policy explains what personal data Fareway collects, why, how long we keep it and the choices you have. We collect only what we need to handle your booking request.",
  updated: "15 October 2026",
  sections: [
    {
      id: "what",
      title: "What we collect",
      body: [
        "Booking requests: the lead traveller's full name as on their passport, email address and phone number; for each traveller, their name, date of birth and passport nationality; any notes you add; and the flight and price you requested.",
        "Price alerts: your email address and the search the alert is for.",
        "We do not collect passport numbers or payment card details on this website.",
        "Technical data: when you use the site, our hosting provider processes your IP address and basic request information to deliver pages and protect against abuse (for example rate limiting). We do not use advertising or tracking cookies.",
      ],
    },
    {
      id: "why",
      title: "Why we use it",
      body: [
        "To handle your booking request: contact you, check availability, confirm the price and complete the booking with you (the lawful basis is taking steps at your request before entering into a contract).",
        "To send the price alerts you ask for (consent; you can turn an alert off at any time).",
        "To keep the service secure and prevent spam and fraud (legitimate interests).",
      ],
    },
    {
      id: "sharing",
      title: "Who we share it with",
      body: [
        "Airlines and booking systems, only when you ask us to complete a booking.",
        "Service providers that host the site, store data and send email for us, under contracts that require them to protect it.",
        "Authorities, when the law requires it. We never sell personal data.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      body: [
        "Requests that expire or are cancelled are deleted after 12 months. Confirmed bookings are kept for as long as accounting and travel regulations require (normally up to 7 years). Price alerts are kept until you turn them off.",
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      body: [
        "You can ask to see, correct or delete your personal data, object to its use or ask for a copy. To delete your data, use the Delete my data page. For other requests, contact customer care.",
        "You also have the right to complain to your local data protection authority.",
      ],
    },
    {
      id: "security",
      title: "Security",
      body: [
        "Data is sent over HTTPS and stored with access limited to the customer care team. Personal details are not written to application logs. Staff accounts use hashed passwords.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      body: [
        "Essential cookies only: fw_currency and fw_locale remember your currency and language; fw_cookie_ok remembers that you have seen the cookie notice; fw_bk_<reference> lets the browser that made a request view it again; authjs.* cookies keep staff signed in to the admin area.",
        "Your browser's local storage remembers your theme, recent searches and price alerts you have set on this device. You can clear these at any time in your browser settings.",
      ],
    },
  ],
};

export const about = {
  title: "About Fareway",
  intro:
    "Fareway is a flight comparison and booking-request service built around people, not checkout pages. Search flights between any countries in the world, choose the one that suits you, and our customer care team takes it from there.",
  points: [
    {
      title: "Every country, including the hard ones",
      body: "We cover 250 countries and territories, from capitals with dozens of daily flights to island nations served by a single airport. Places without their own airport, such as Monaco or Vatican City, are linked to their nearest airports.",
    },
    {
      title: "No payment on the website",
      body: "You never type card details here. When you are ready, customer care confirms the final price with you and explains how to pay. Your booking is confirmed only once payment is complete.",
    },
    {
      title: "Honest prices",
      body: "We show prices as indicative, tell you what is included and never use fake countdowns or invented scarcity.",
    },
  ],
};

export const faq: { q: string; a: string }[] = [
  {
    q: "Do I pay on the Fareway website?",
    a: "No. Fareway never takes payment online. After you send a request, contact customer care with your reference number. They confirm the final price and explain how to pay.",
  },
  {
    q: "Is my booking confirmed when I send a request?",
    a: "Not yet. A request saves your chosen flight and details with a reference number. Your booking is only confirmed after payment is completed through customer care.",
  },
  {
    q: "Why might the final price differ from the price on the site?",
    a: "Prices on the site are indicative. Airline fares change often, and some taxes depend on the exact booking. Customer care always confirms the final price with you before you pay.",
  },
  {
    q: "How long is my request held?",
    a: "48 hours. If we have not heard from you by then, it expires and you can simply search again.",
  },
  {
    q: "How do I contact customer care?",
    a: "By WhatsApp, phone or email. The buttons on your confirmation page are prefilled with your reference and flight. Our hours are shown on the Contact page.",
  },
  {
    q: "I lost my reference number. What can I do?",
    a: "Check the confirmation email we sent you. If you cannot find it, contact customer care with the email address you used and we will look it up.",
  },
  {
    q: "Can I fly to or from a country without an airport?",
    a: "Yes. Countries without their own airport, such as Monaco, Andorra or Vatican City, are linked to the nearest airports, and searches use those automatically.",
  },
  {
    q: "What details do I need for each traveller?",
    a: "Names exactly as on the passport, date of birth and passport nationality. We do not ask for passport numbers on the website.",
  },
  {
    q: "Can I book for more than 9 travellers?",
    a: "Online requests are limited to 9 travellers. For larger groups, contact customer care directly.",
  },
  {
    q: "How do I delete my data?",
    a: "Use the Delete my data page. We remove your booking requests and price alerts within 30 days.",
  },
];
