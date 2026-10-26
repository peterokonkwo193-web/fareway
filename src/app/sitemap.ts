import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "daily" },
    { path: "/explore", priority: 0.9, freq: "daily" },
    { path: "/faq", priority: 0.6, freq: "monthly" },
    { path: "/contact", priority: 0.6, freq: "monthly" },
    { path: "/about", priority: 0.5, freq: "monthly" },
    { path: "/booking/lookup", priority: 0.4, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/data-request", priority: 0.2, freq: "yearly" },
  ];
  return [
    ...pages.map((p) => ({ url: `${siteConfig.url}${p.path}`, lastModified: now, changeFrequency: p.freq, priority: p.priority })),
    ...CONTINENTS.map((c) => ({
      url: `${siteConfig.url}/explore?continent=${encodeURIComponent(c)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
