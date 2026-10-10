import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="bg-hero text-white">
      <div className="container-page py-16 md:py-24">
        <h1 className="text-[2rem] leading-[2.375rem] font-extrabold tracking-tight md:text-[2.5rem] md:leading-[3rem]">
          Find the cheapest way to fly
        </h1>
        <p className="mt-3 max-w-xl text-white/85">Search widget arrives in the next step.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="cta" size="xl">Search flights</Button>
          <span className="rounded-xl bg-card px-4 py-3 text-2xl font-bold text-price tnum">$389</span>
        </div>
      </div>
    </section>
  );
}
