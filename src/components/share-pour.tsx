import { useEffect, useState } from "react";
import { Link2, Share2 } from "lucide-react";
import { notice } from "@/lib/notice";
import {
  canNativeShare,
  downloadBlob,
  nativeShareImage,
  renderPourShareCard,
  shareFilename,
} from "@/lib/share-card";
import { getWebsiteShareUrl } from "@/lib/qr-code";
import { type Pour } from "@/lib/pours";
import { patternLabel, useLocale, useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SharePourButton({
  pour,
  variant = "icon",
  className,
}: {
  pour: Pour;
  variant?: "icon" | "cta";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const t = useT();
  const locale = useLocale();
  const title = `${t("bloom")} · ${patternLabel(pour.pattern, locale)}`;
  const shareUrl = getWebsiteShareUrl();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function openShare() {
    setOpen(true);
    if (blob && preview) return;
    setBusy(true);
    try {
      const next = await renderPourShareCard(pour);
      setBlob(next);
      setPreview(URL.createObjectURL(next));
    } catch {
      notice(t("shareFailed"));
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function sendToFriends() {
    if (!blob) return;
    try {
      const result = await nativeShareImage(
        blob,
        shareFilename(pour),
        title,
        shareUrl,
      );
      if (result !== "shared") notice(t("shareSavedSend"));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      downloadBlob(blob, shareFilename(pour));
      notice(t("shareSaved"));
    }
  }

  async function saveImage() {
    if (!blob) return;
    if (canNativeShare()) {
      try {
        const result = await nativeShareImage(
          blob,
          shareFilename(pour),
          title,
          shareUrl,
        );
        if (result === "shared") {
          notice(t("shareSavedSend"));
          return;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    downloadBlob(blob, shareFilename(pour));
    notice(t("shareDownloaded"));
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      notice(t("linkCopied"));
    } catch {
      notice(t("linkCopied"));
    }
  }

  return (
    <>
      {variant === "cta" ? (
        <Button
          type="button"
          size="pill"
          className={className}
          onClick={() => void openShare()}
        >
          <Share2 />
          {t("shareFriends")}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("share")}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void openShare();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Share2 className="size-4" />
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
        }}
      >
        <DialogContent className="max-h-[92dvh] w-[min(100%-1.5rem,22rem)] overflow-y-auto gap-3 p-4 flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{t("shareThis")}</DialogTitle>
            <DialogDescription>{t("shareBody")}</DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              "relative flex max-h-[48vh] sm:max-h-[360px] w-full items-center justify-center overflow-hidden rounded-xl bg-cream/70 p-1",
              busy && "animate-pulse",
            )}
          >
            {preview ? (
              <img
                src={preview}
                alt={title}
                className="max-h-[46vh] sm:max-h-[350px] w-auto max-w-full rounded-lg object-contain shadow-xs select-auto"
              />
            ) : (
              <div className="aspect-[3/4] h-56 w-full" />
            )}
          </div>
          <p className="text-center text-[11px] text-muted -mt-1">
            {locale === "en"
              ? "Tip: Long-press image to save directly to Photos"
              : "长按上方图片可直接「存储到系统相册」"}
          </p>

          {shareUrl ? (
            <div className="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface px-3 py-2 text-xs">
              <div className="flex min-w-0 items-center gap-1.5 text-muted">
                <Link2 className="size-3.5 shrink-0" />
                <span className="truncate">{shareUrl.replace(/^https?:\/\//, "")}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2.5 text-xs font-medium hover:bg-cream"
                onClick={() => void copyShareLink()}
              >
                {t("copyLink")}
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              disabled={!blob || busy}
              onClick={saveImage}
            >
              {t("saveImage")}
            </Button>
            <Button
              type="button"
              disabled={!blob || busy}
              onClick={() => void sendToFriends()}
            >
              {canNativeShare() ? t("sendToFriends") : t("downloadShare")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
