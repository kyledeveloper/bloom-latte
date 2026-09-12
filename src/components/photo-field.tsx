import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/pours";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function PhotoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (src: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = useT();

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("pickPhoto"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await compressImage(file);
      onChange(data);
    } catch {
      setError(t("photoFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl bg-cream",
          "shadow-[var(--shadow-border)]",
        )}
      >
        {value ? (
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className="size-full"
            aria-label={t("changePhoto")}
          >
            <img
              src={value}
              alt={t("takePhoto")}
              className="pour-photo photo-in size-full object-cover"
            />
          </button>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="text-muted">
              <Camera className="size-7" strokeWidth={1.5} />
            </span>
            <p className="font-display text-lg tracking-tight">{t("takePhoto")}</p>
            <p className="text-sm text-muted">{t("takePhotoHint")}</p>
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-bg/60 text-sm text-muted">
            {t("processingPhoto")}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera />
          {t("camera")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => libraryRef.current?.click()}
        >
          <ImagePlus />
          {t("library")}
        </Button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
