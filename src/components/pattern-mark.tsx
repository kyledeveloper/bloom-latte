import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PatternId } from "@/lib/pours";

type MarkProps = {
  className?: string;
  title?: string;
};

function Svg({
  className,
  title,
  children,
}: MarkProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-5", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function PatternMark({
  id,
  className,
}: {
  id: PatternId;
  className?: string;
}) {
  const marks: Record<PatternId, ReactNode> = {
    heart: (
      <Svg className={className}>
        <path
          d="M16 26c-6.2-4.4-10-8.6-10-13.1C6 9.4 8.7 7 12 7c1.9 0 3.4.9 4 2.2C16.6 7.9 18.1 7 20 7c3.3 0 6 2.4 6 5.9 0 4.5-3.8 8.7-10 13.1Z"
          fill="currentColor"
        />
      </Svg>
    ),
    tulip: (
      <Svg className={className}>
        <circle cx="16" cy="22.5" r="3.2" fill="currentColor" />
        <circle cx="16" cy="16.4" r="3.6" fill="currentColor" />
        <circle cx="16" cy="9.6" r="4.2" fill="currentColor" />
      </Svg>
    ),
    rosetta: (
      <Svg className={className}>
        <path
          d="M16 6c2.4 2.2 3.6 4.4 3.6 6.4 0 1.4-.8 2.4-2.2 2.4H16M16 6c-2.4 2.2-3.6 4.4-3.6 6.4 0 1.4.8 2.4 2.2 2.4H16M16 14.8c2.8 2.4 4.2 4.8 4.2 7 0 1.6-1 2.8-2.6 2.8H16M16 14.8c-2.8 2.4-4.2 4.8-4.2 7 0 1.6 1 2.8 2.6 2.8H16M16 24.6v2.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    swan: (
      <Svg className={className}>
        <path
          d="M8 22c2.4-6 7-9.5 12.5-8.2 2.2.5 3.8-.6 4.2-2.4.3-1.4-.4-2.6-1.6-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7.5 23.5c3.2 2.4 8.6 3 13.2.4 3.2-1.8 4.8-4.6 4.6-7.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="24.4" cy="7.4" r="1.15" fill="currentColor" />
      </Svg>
    ),
    "winged-heart": (
      <Svg className={className}>
        <path
          d="M16 21.5c-3.4-2.4-5.5-4.7-5.5-7.1C10.5 12.6 12 11.4 13.7 11.4c1 0 1.8.5 2.3 1.2.5-.7 1.3-1.2 2.3-1.2 1.7 0 3.2 1.2 3.2 3 0 2.4-2.1 4.7-5.5 7.1Z"
          fill="currentColor"
        />
        <path
          d="M6 14.5c2.6-1.4 5.2-1.2 7.2.6M26 14.5c-2.6-1.4-5.2-1.2-7.2.6M5.5 18.2c3.2-.4 6.2.8 8 2.8M26.5 18.2c-3.2-.4-6.2.8-8 2.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    ),
    phoenix: (
      <Svg className={className}>
        <path
          d="M16 26V11"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M16 12c3.4-1.2 6.8.2 8.8 3.2M16 12c-3.4-1.2-6.8.2-8.8 3.2M16 16.5c4.2-.4 7.6 1.6 9.2 4.6M16 16.5c-4.2-.4-7.6 1.6-9.2 4.6M16 20.5c3.4.2 6 1.6 7.4 3.6M16 20.5c-3.4.2-6 1.6-7.4 3.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="8.5" r="2" fill="currentColor" />
      </Svg>
    ),
    "free-pour": (
      <Svg className={className}>
        <path
          d="M8 22c2-6 5-10 8-11 3-1 6 1 7 4 1 3-1 6-4 7-3 1-6-1-7.5-3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </Svg>
    ),
  };
  return <>{marks[id]}</>;
}
