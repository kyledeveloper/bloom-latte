export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className ?? "size-8"} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <circle cx="16" cy="15" r="8" className="fill-bg" />
      <path
        d="M16 20.6c-2.7-1.9-4.4-3.7-4.4-5.6 0-1.5 1.1-2.6 2.5-2.6.8 0 1.5.4 1.9 1 .4-.6 1.1-1 1.9-1 1.4 0 2.5 1.1 2.5 2.6 0 1.9-1.7 3.7-4.4 5.6Z"
        className="fill-fg"
      />
    </svg>
  );
}
