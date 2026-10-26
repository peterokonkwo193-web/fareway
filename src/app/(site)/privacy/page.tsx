import type { Metadata } from "next";
import { LongPageView } from "@/components/legal/long-page";
import { getContent } from "@/content";
import { privacy } from "@/content/en/legal";

export const metadata: Metadata = { title: privacy.title, description: privacy.intro.slice(0, 155) };

export default async function Page() {
  const content = await getContent();
  return <LongPageView page={content.privacy} />;
}
