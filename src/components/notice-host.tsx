import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Notice = { title?: string; message: string };

let pushNotice: ((notice: Notice) => void) | null = null;

export function notice(message: string, title = "提示") {
  pushNotice?.({ title, message });
}

export function NoticeHost() {
  const [current, setCurrent] = useState<Notice | null>(null);

  useEffect(() => {
    pushNotice = (next) => setCurrent(next);
    return () => {
      pushNotice = null;
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
          <DialogTitle>{current?.title ?? "提示"}</DialogTitle>
          <DialogDescription className="text-base text-fg">
            {current?.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="pill" onClick={() => setCurrent(null)}>
            好的
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
