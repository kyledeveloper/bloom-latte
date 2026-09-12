import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/pours";
import { cn } from "@/lib/utils";
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

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择一张照片");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await compressImage(file);
      onChange(data);
    } catch {
      setError("照片处理失败，请换一张试试");
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
          <img
            src={value}
            alt="这杯拉花"
            className="pour-photo size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="text-muted">
              <Camera className="size-7" strokeWidth={1.5} />
            </span>
            <p className="font-display text-lg tracking-tight">拍下这杯</p>
            <p className="text-sm text-muted">正上方俯拍，泡沫最清楚</p>
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-bg/60 text-sm text-muted">
            处理照片…
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
          拍照
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => libraryRef.current?.click()}
        >
          <ImagePlus />
          相册
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
