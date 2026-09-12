import { cn } from "@/lib/utils";

export function PourPhoto({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={960}
      height={960}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn("pour-photo aspect-square w-full object-cover", className)}
    />
  );
}
