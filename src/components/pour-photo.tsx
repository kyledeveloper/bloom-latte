import { useEffect, useRef, useState } from "react";
import { getBearerToken } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

function isDirectSrc(src: string) {
  return (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/pours/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
}

export function PourPhoto({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  pourId?: string;
  priority?: boolean;
  className?: string;
}) {
  const [remote, setRemote] = useState("");
  const [failed, setFailed] = useState(false);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    setFailed(false);
    if (!src.startsWith("/api/")) {
      setRemote("");
      return;
    }
    let alive = true;
    const headers = new Headers();
    const token = getBearerToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const href = token
      ? `${src}${src.includes("?") ? "&" : "?"}bt=${encodeURIComponent(token)}`
      : src;
    void fetch(href, { headers, credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("photo");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (!alive) {
          URL.revokeObjectURL(url);
          return;
        }
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = url;
        setRemote(url);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const displaySrc = isDirectSrc(src) ? src : remote;

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid aspect-square w-full place-items-center bg-cream px-6 text-center text-sm text-muted",
          className,
        )}
      >
        照片还没带上
      </div>
    );
  }

  if (!displaySrc) {
    return (
      <div
        className={cn("aspect-square w-full animate-pulse bg-cream", className)}
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      width={960}
      height={960}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={cn("pour-photo aspect-square w-full object-cover", className)}
    />
  );
}
