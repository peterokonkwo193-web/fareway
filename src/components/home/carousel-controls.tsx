"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Horizontal scroll-snap rail with previous/next buttons. Content stays a plain, keyboard-reachable list. */
export function Carousel({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div className="absolute -top-14 right-0 hidden gap-2 md:flex">
        <Button type="button" variant="outline" size="icon-lg" className="rounded-full" onClick={() => scroll(-1)} aria-label={`Previous: ${label}`}>
          <ChevronLeft className="size-5" />
        </Button>
        <Button type="button" variant="outline" size="icon-lg" className="rounded-full" onClick={() => scroll(1)} aria-label={`Next: ${label}`}>
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <ul
        ref={ref}
        aria-label={label}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {children}
      </ul>
    </div>
  );
}
