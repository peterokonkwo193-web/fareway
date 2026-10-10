export const siteConfig = {
  name: "Fareway",
  description:
    "Compare flights to and from every country in the world. Choose a flight, send a request, and our customer care team confirms the price and completes your booking.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};
