export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="paper-grain flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="mb-8 select-none text-center">
        <div className="relative inline-block">
          <h1 className="font-heading text-[42px] font-semibold italic leading-none tracking-tight text-ink">
            ThoughtPad
          </h1>
          {/* Hand-drawn ink underline */}
          <svg
            viewBox="0 0 220 14"
            aria-hidden
            className="absolute -bottom-2 left-0 h-[12px] w-full text-ink/80"
            fill="none"
          >
            <path
              d="M3 9 C 40 3, 78 12, 118 7 S 190 4, 217 8"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-[13px] tracking-[0.18em] text-muted uppercase">
          A quiet place for loud thoughts
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 shadow-[0_1px_0_rgba(26,26,26,0.04),0_12px_32px_-16px_rgba(26,26,26,0.12)] sm:p-8">
        {children}
      </div>

      <p className="mt-8 max-w-xs text-center text-[12px] leading-relaxed text-muted">
        Private by design. Your brain dumps live in your own sealed notebook —
        nobody else can ever see them.
      </p>
    </main>
  );
}
