export type Notice = { title?: string; message: string };

let pushNotice: ((notice: Notice) => void) | null = null;

export function setNoticeHandler(handler: ((notice: Notice) => void) | null) {
  pushNotice = handler;
}

export function notice(message: string, title?: string) {
  pushNotice?.({ title, message });
}
