import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { notice } from "@/lib/notice";
import {
  canNativeShare,
  downloadBlob,
  nativeShareImage,
  renderPourShareCard,
  shareFilename,
} from "@/lib/share-card";
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
      const result = await nativeShareImage(blob, shareFilename(pour), title);
      if (result !== "shared") notice(t("shareSavedSend"));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      downloadBlob(blob, shareFilename(pour));
      notice(t("shareSaved"));
    }
  }

  function saveImage() {
    if (!blob) return;
    downloadBlob(blob, shareFilename(pour));
    notice(t("shareDownloaded"));
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
        <DialogContent className="w-[min(100%-1.5rem,22rem)] gap-3 p-4">
          <DialogHeader>
            <DialogTitle>{t("shareThis")}</DialogTitle>
            <DialogDescription>{t("shareBody")}</DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              "overflow-hidden rounded-lg bg-cream",
              busy && "animate-pulse",
            )}
          >
            {preview ? (
              <img
                src={preview}
                alt={title}
                className="block w-full"
              />
            ) : (
              <div className="aspect-[3/4] w-full" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
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
