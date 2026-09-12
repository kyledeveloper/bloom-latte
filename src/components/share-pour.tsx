import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  canNativeShare,
  downloadBlob,
  nativeShareImage,
  renderPourShareCard,
  shareFilename,
} from "@/lib/share-card";
import { patternOf, type Pour } from "@/lib/pours";
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
  const pattern = patternOf(pour.pattern);
  const title = `杯中花 · ${pattern.name}`;

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
      toast("这张图没生成出来，再试一次。");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function sendToFriends() {
    if (!blob) return;
    try {
      const result = await nativeShareImage(blob, shareFilename(pour), title);
      if (result === "shared") toast("已打开分享。");
      else toast("图片已保存，发给朋友吧。");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      downloadBlob(blob, shareFilename(pour));
      toast("图片已保存。");
    }
  }

  function saveImage() {
    if (!blob) return;
    downloadBlob(blob, shareFilename(pour));
    toast("已保存到相册 / 下载。");
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
          分享给朋友
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="分享"
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
            <DialogTitle>分享这杯</DialogTitle>
            <DialogDescription>
              生成一张卡片，发给朋友或存进相册。
            </DialogDescription>
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
                alt={`${pattern.name}分享卡片`}
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
              保存图片
            </Button>
            <Button
              type="button"
              disabled={!blob || busy}
              onClick={() => void sendToFriends()}
            >
              {canNativeShare() ? "发给朋友" : "下载分享"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
