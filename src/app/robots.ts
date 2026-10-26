import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Personal or transient pages stay out of search engines.
        disallow: ["/admin", "/api/", "/book/", "/booking/FW-", "/flights/m1."],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
