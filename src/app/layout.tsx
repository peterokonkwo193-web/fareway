import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Providers } from "@/components/providers";
import { FlagPolyfill } from "@/components/flag-polyfill";
import { getCurrency } from "@/lib/preferences";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Fareway – Compare cheap flights worldwide", template: "%s | Fareway" },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "Fareway – Compare cheap flights worldwide",
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1424" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers currency={currency}>{children}</Providers>
        </NextIntlClientProvider>
        <FlagPolyfill />
      </body>
    </html>
  );
}
