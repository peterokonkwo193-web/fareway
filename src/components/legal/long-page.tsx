import type { LongPage } from "@/content/en/legal";

export function LongPageView({ page }: { page: LongPage }) {
  return (
    <article className="container-page max-w-3xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">{page.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {page.updated}</p>
        <p className="mt-4 text-lg text-muted-foreground">{page.intro}</p>
      </header>
      <nav aria-label="On this page" className="card-surface mb-8 p-4">
        <h2 className="mb-2 text-sm font-semibold">On this page</h2>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {page.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-link hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="space-y-8">
        {page.sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
            <h2 id={`${s.id}-h`} className="mb-3 text-xl font-bold">
              {s.title}
            </h2>
            <div className="space-y-3 leading-relaxed">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
