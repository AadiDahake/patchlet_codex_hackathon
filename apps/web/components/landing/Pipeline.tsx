import { Eyebrow } from "./Eyebrow";

const STAGES = [
  { label: "Widget on your page", tone: "neutral" },
  { label: "Three checks", tone: "neutral" },
  { label: "Verdict", tone: "accent" },
  { label: "Issue and draft PR", tone: "neutral" },
  { label: "Your approval", tone: "soft" },
] as const;

const FACTS = [
  "Three checks before a verdict",
  "One human approval before a merge",
  "Every step written to the trace",
] as const;

/**
 * The five stages, laid out so they always fit the card they sit in.
 *
 * The stages share the width equally in a grid rather than sitting in a row wide enough to need
 * its own scrollbar, and the connector between them is a hairline drawn in the gap, so it costs
 * no track. Below the wide breakpoint the same grid becomes a vertical stepper.
 */
export function Pipeline() {
  return (
    <section id="pipeline" className="border-t border-line/60 bg-surface/30 py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Eyebrow>The pipeline</Eyebrow>
            <h2 className="mt-5 font-display text-4xl leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Every step is on the <br />
              <span className="font-medium text-accent italic">record.</span>
            </h2>
          </div>
          <p className="leading-relaxed text-ink/60 lg:col-span-4">
            One trace per conversation. Every probe, verdict, model call and artefact is written
            down as it happens, and streamed to the console live.
          </p>
        </div>

        <div className="rounded-[32px] border border-line/70 bg-panel p-6 shadow-[0_24px_50px_-30px_rgba(23,32,28,0.4)] sm:p-8 lg:p-12">
          <ol className="pipeline">
            {STAGES.map((stage, index) => (
              <li key={stage.label} className={`pipeline__stage is-${stage.tone}`}>
                {index > 0 ? <span className="pipeline__link" aria-hidden /> : null}
                <span className="pipeline__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="pipeline__label">{stage.label}</span>
              </li>
            ))}
          </ol>

          <ul className="pipeline__facts">
            {FACTS.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
