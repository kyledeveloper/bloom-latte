import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { setNoticeHandler, type Notice } from "@/lib/notice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function NoticeHost() {
  const [current, setCurrent] = useState<Notice | null>(null);
  const t = useT();

  useEffect(() => {
    setNoticeHandler((next) => setCurrent(next));
    return () => {
      setNoticeHandler(null);
    };
  }, []);

  return (
    <Dialog
      open={Boolean(current)}
      onOpenChange={(open) => {
        if (!open) setCurrent(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current?.title || t("notice")}</DialogTitle>
          <DialogDescription className="text-base text-fg">
            {current?.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="pill" onClick={() => setCurrent(null)}>
            {t("ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
