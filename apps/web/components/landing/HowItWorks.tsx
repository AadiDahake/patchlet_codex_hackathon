import { Eyebrow } from "./Eyebrow";
import { IconBranch, IconChecks, IconScreen } from "./icons";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    kicker: "Ask",
    title: "Someone asks in your app.",
    body: "The widget sits in the corner of your product. It reads the page, collects the controls that are really there, and sends the question with them.",
    icon: <IconScreen />,
  },
  {
    n: "02",
    kicker: "Check",
    title: "Three checks run at once.",
    body: "Your documentation, the live interface and the repository each answer on their own. The console shows every score as it lands.",
    icon: <IconChecks />,
  },
  {
    n: "03",
    kicker: "Ship",
    title: "The gap becomes a pull request.",
    body: "Patchlet files the issue, drafts the change, opens a draft pull request, and waits for a developer to approve before anything merges.",
    icon: <IconBranch />,
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-line/60 bg-surface/30 py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-20 grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              From a question to a <br className="hidden sm:block" />
              <span className="font-medium text-accent italic">merged</span> pull request.
            </h2>
          </div>
          <p className="text-[17px] leading-relaxed text-ink/60 lg:col-span-4 lg:col-start-9">
            Three quiet steps between a confused user and a change on your main branch. No ticket
            queue, no triage rota, no engineer paged.
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3 lg:gap-7">
          {/* The dashed rule tying the three cards together, drawn behind their icon row. */}
          <svg
            aria-hidden
            className="pointer-events-none absolute top-14 right-[14%] left-[14%] hidden h-6 w-[72%] md:block"
            viewBox="0 0 800 24"
            preserveAspectRatio="none"
          >
            <path
              d="M0 12 L800 12"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              className="animate-dash"
              opacity="0.45"
            />
          </svg>

          {STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 120} className="h-full">
            <article
              className="group relative h-full rounded-[28px] border border-line/70 bg-[var(--glass)] p-8 shadow-[var(--glass-highlight)] backdrop-blur-[30px] transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/25 hover:shadow-[var(--shadow)]"
            >
              <div className="mb-7 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line/80 bg-paper text-accent transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-panel">
                  {step.icon}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-ink/40 uppercase">
                    {step.kicker}
                  </p>
                  <p className="mt-1 font-display text-3xl leading-none text-accent/70 italic">
                    {step.n}
                  </p>
                </div>
              </div>
              <h3 className="mb-3 font-display text-[1.65rem] leading-[1.15] tracking-tight">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink/65">{step.body}</p>
            </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
