import Link from "next/link";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-28 pb-32 text-center lg:px-10 lg:pt-36 lg:pb-40">
        {/* Concentric rings behind the headline: the only decoration on the page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="animate-pulse-soft absolute h-[760px] w-[760px] rounded-full bg-sage/15 opacity-60 blur-3xl" />
          <div className="absolute h-[620px] w-[620px] rounded-full border border-accent/5" />
          <div className="absolute h-[440px] w-[440px] rounded-full border border-accent/10" />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center">
          <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-accent/10 bg-accent/5 px-3 py-1">
            <span className="animate-pulse-soft h-2 w-2 rounded-full bg-accent" />
            <span className="text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">
              Documentation, page and repository
            </span>
          </div>

          <h1 className="max-w-4xl font-display text-4xl leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.75rem]">
            Support that answers honestly, and{" "}
            <span className="hero-underline font-medium text-accent italic">builds</span> what it
            could not find.
          </h1>

          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-ink/65">
            Patchlet answers from your own documentation, points at the real control on the page the
            user is already looking at, and opens the pull request when the feature does not exist.
          </p>

          {/* Both calls stay on the marketing side. The trace this used to link to belongs to a
              project, so a visitor who has not made one had nothing to watch. */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/signin?mode=signup"
              className="rounded-full bg-accent-deep px-8 py-4 text-base font-medium text-panel shadow-xl shadow-accent/20 transition-all hover:-translate-y-0.5 hover:bg-accent"
            >
              Get started
            </Link>
            <a href="#how" className="group inline-flex items-center gap-2 font-semibold text-accent">
              See how it works
              <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
                &darr;
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
