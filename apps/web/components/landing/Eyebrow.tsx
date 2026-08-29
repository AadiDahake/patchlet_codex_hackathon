/** The small rule-and-label that opens every section on the landing page. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="h-px w-8 bg-accent/40" />
      <span className="text-[11px] font-semibold tracking-[0.22em] text-accent/80 uppercase">
        {children}
      </span>
    </div>
  );
}
