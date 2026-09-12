import { useEffect, useRef, useState } from "react";
import { getBearerToken } from "@/lib/auth/client";
import { loadLocalPhoto, saveLocalPhoto } from "@/lib/photo-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

function isDirectSrc(src: string) {
  return (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/pours/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
}

function objectUrlFrom(data: string | Blob) {
  if (typeof data === "string") {
    if (data.startsWith("data:")) {
      const comma = data.indexOf(",");
      const mime = /data:(image\/[a-zA-Z0-9.+-]+)/.exec(data)?.[1] ?? "image/jpeg";
      const binary = atob(data.slice(comma + 1));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    }
    return data;
  }
  return URL.createObjectURL(data);
}

export function PourPhoto({
  src,
  alt,
  pourId,
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
  const t = useT();

  useEffect(() => {
    setFailed(false);
    let alive = true;

    function show(url: string) {
      if (!alive) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        return;
      }
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      blobRef.current = url.startsWith("blob:") ? url : null;
      setRemote(url);
    }

    void (async () => {
      if (pourId) {
        const local = await loadLocalPhoto(pourId);
        if (!alive) return;
        if (local) {
          show(objectUrlFrom(local));
          return;
        }
      }
      if (!src.startsWith("/api/")) {
        setRemote("");
        return;
      }
      const headers = new Headers();
      const token = getBearerToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const href = token
        ? `${src}${src.includes("?") ? "&" : "?"}bt=${encodeURIComponent(token)}`
        : src;
      try {
        const res = await fetch(href, {
          headers,
          credentials: "include",
          cache: "force-cache",
        });
        if (!res.ok) throw new Error("photo");
        const blob = await res.blob();
        if (pourId) void saveLocalPhoto(pourId, blob);
        if (!alive) return;
        show(URL.createObjectURL(blob));
      } catch {
        if (alive) setFailed(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [src, pourId]);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const displaySrc = isDirectSrc(src) && !remote ? src : remote || (isDirectSrc(src) ? src : "");

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid aspect-square w-full place-items-center bg-cream px-6 text-center text-sm text-muted",
          className,
        )}
      >
        {t("photoMissing")}
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
      className={cn(
        "pour-photo photo-in aspect-square w-full object-cover",
        className,
      )}
    />
  );
}
