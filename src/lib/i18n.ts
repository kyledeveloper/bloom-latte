import { useSyncExternalStore } from "react";

export type Locale = "zh" | "en";

const KEY = "bloom-locale";
const listeners = new Set<() => void>();

function detect(): Locale {
  if (typeof navigator === "undefined") return "zh";
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function readStored(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "en" || raw === "zh" ? raw : null;
  } catch {
    return null;
  }
}

let current: Locale = readStored() ?? detect();

export function getLocale(): Locale {
  return current;
}

export function setLocale(next: Locale) {
  if (next === current) return;
  current = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => "zh");
}

const zh = {
  signIn: "登录",
  signOut: "退出",
  signingOut: "正在退出…",
  account: "账号",
  backup: "备份",
  backingUp: "备份中…",
  language: "语言",
  record: "记录",
  tagline: "倒一杯，开一朵。",
  bloom: "杯中花",
  bloomSub: "Bloom · 拉花手记",
  pageDesc: "杯中花 · 记录每一次拉花。照片、图案、豆子与评分，装进一本咖啡手记。",
  examplesHint: "现在看到的是示例。登录后开始记你自己的拉花。",
  emptyHint: "你的手记还是空的。下面是示例，点「记录」记第一杯。",
  practicedMost: "练得最多",
  cups: "杯",
  avg: "均分",
  streak: "连续",
  streakDays: "{n} 日",
  all: "全部",
  demo: "示例",
  emptyFiltered: "这个图案还是空白",
  emptyNone: "还没有开出第一朵",
  emptyFilteredBody: "换个筛选，或者现在就去拉一杯这个形状。",
  emptySignedInBody: "倒一杯热牛奶，在浓缩上留下你的图案。",
  emptyGuestBody: "登录后开始记你自己的拉花。",
  newPour: "记录一杯",
  savePour: "保存这杯",
  saveEdit: "保存修改",
  saving: "保存中…",
  pleaseSignIn: "请先登录",
  savedLocal: "记下了。这杯只在这台设备上，需要时再备份到云端。",
  saveFailed: "没保存上，再试一次。",
  updatedLocal: "已更新。改动只在这台设备上。",
  deleted: "删掉了。",
  openingPour: "正在打开这杯…",
  pourMissingTitle: "找不到这杯",
  pourMissing: "这页已经不在手记里了。",
  backToJournal: "回到手记",
  latteArt: "拉花",
  edit: "编辑",
  cancelEdit: "取消编辑",
  delete: "删除",
  deleteThis: "删掉这杯？",
  deleteBody: "照片和笔记都会从这台设备的手记里拿走。",
  keep: "留下",
  noNotes: "这杯没有写笔记。",
  photoMissing: "照片还没带上",
  takePhoto: "拍下这杯",
  takePhotoHint: "正上方俯拍，泡沫最清楚",
  camera: "拍照",
  library: "相册",
  changePhoto: "更换照片",
  processingPhoto: "处理照片…",
  pickPhoto: "请选择一张照片",
  photoFailed: "照片处理失败，请换一张试试",
  needPhoto: "先拍一张，再记下这杯。",
  pattern: "图案",
  rating: "评分",
  beans: "豆子",
  beansPh: "埃塞俄比亚 古吉",
  grind: "研磨度",
  grindPh: "中细 / EK43 8.5",
  milk: "奶",
  date: "日期",
  notes: "笔记",
  notesPh: "奶泡细不细，收口偏哪边，下次改什么。",
  patternsAria: "拉花图案",
  back: "返回",
  share: "分享",
  shareFriends: "分享给朋友",
  shareThis: "分享这杯",
  shareBody: "生成一张卡片，发给朋友或存进相册。",
  shareFailed: "这张图没生成出来，再试一次。",
  shareSavedSend: "图片已保存，发给朋友吧。",
  shareSaved: "图片已保存。",
  shareDownloaded: "已保存到相册 / 下载。",
  backupOk: "已做冷备份。换设备时，空着手记登录会从这里恢复。",
  backupFail: "备份没完成，稍后再试。",
  loginLead: "登录之后，拉花跟着账号走。换手机打开同一个网页，本子还在。",
  email: "邮箱",
  password: "密码",
  wait: "请稍等…",
  registerLogin: "注册并登录",
  noAccount: "还没有账号？注册一个",
  hasAccount: "已有账号？去登录",
  continueWith: "使用 {name} 继续",
  emailOnly: "这个网站请用邮箱注册登录。Google / X 只在 Grok 预览里可用。",
  seeExamples: "先看看示例",
  registerFail: "注册失败",
  loginFail: "没登录上，再试一次。",
  socialFail: "Google / X 在这个网站上不可用，请用邮箱登录。",
  milkWhole: "全脂鲜奶",
  milkOat: "燕麦奶",
  milkAlmond: "杏仁奶",
  milkSoy: "豆奶",
  milkCoconut: "椰奶",
  heart: "爱心",
  tulip: "郁金香",
  rosetta: "罗斯塔",
  swan: "天鹅",
  wingedHeart: "翅膀爱心",
  phoenix: "凤凰",
  freePour: "自由拉花",
  shareTag: "倒一杯，开一朵",
  saveImage: "保存图片",
  sendToFriends: "发给朋友",
  downloadShare: "下载分享",
} as const;

const en: Record<keyof typeof zh, string> = {
  signIn: "Sign in",
  signOut: "Sign out",
  signingOut: "Signing out…",
  account: "Account",
  backup: "Backup",
  backingUp: "Backing up…",
  language: "Language",
  record: "Log",
  tagline: "Pour a cup, bloom a flower.",
  bloom: "Bloom Latte",
  bloomSub: "Latte journal",
  pageDesc: "Bloom Latte · a journal for pours, patterns, beans, and scores.",
  examplesHint: "These are sample pours. Sign in to start your own journal.",
  emptyHint: "Your journal is empty. Samples below — tap Log for the first cup.",
  practicedMost: "Most practiced",
  cups: "Cups",
  avg: "Avg",
  streak: "Streak",
  streakDays: "{n}d",
  all: "All",
  demo: "Sample",
  emptyFiltered: "Nothing in this pattern yet",
  emptyNone: "No first bloom yet",
  emptyFilteredBody: "Clear the filter, or go pour this shape.",
  emptySignedInBody: "Steam some milk and leave a mark on the espresso.",
  emptyGuestBody: "Sign in to record your own latte art.",
  newPour: "Log a cup",
  savePour: "Save this cup",
  saveEdit: "Save changes",
  saving: "Saving…",
  pleaseSignIn: "Please sign in",
  savedLocal: "Saved on this device. Back up when you want it in the cloud.",
  saveFailed: "Couldn’t save. Try again.",
  updatedLocal: "Updated on this device.",
  deleted: "Deleted.",
  openingPour: "Opening this cup…",
  pourMissingTitle: "Cup not found",
  pourMissing: "This page is no longer in the journal.",
  backToJournal: "Back to journal",
  latteArt: "Latte art",
  edit: "Edit",
  cancelEdit: "Cancel edit",
  delete: "Delete",
  deleteThis: "Delete this cup?",
  deleteBody: "The photo and notes will leave this device.",
  keep: "Keep",
  noNotes: "No notes on this cup.",
  photoMissing: "Photo didn’t come through",
  takePhoto: "Capture this cup",
  takePhotoHint: "Shoot from above, foam side up",
  camera: "Camera",
  library: "Library",
  changePhoto: "Change photo",
  processingPhoto: "Processing…",
  pickPhoto: "Please choose a photo",
  photoFailed: "Couldn’t process that photo. Try another.",
  needPhoto: "Take a photo first.",
  pattern: "Pattern",
  rating: "Rating",
  beans: "Beans",
  beansPh: "Ethiopia Guji",
  grind: "Grind",
  grindPh: "Medium-fine / EK43 8.5",
  milk: "Milk",
  date: "Date",
  notes: "Notes",
  notesPh: "Foam texture, where the finish drifted, what to change.",
  patternsAria: "Latte art patterns",
  back: "Back",
  share: "Share",
  shareFriends: "Share",
  shareThis: "Share this cup",
  shareBody: "Make a card to send or save.",
  shareFailed: "Couldn’t build the image. Try again.",
  shareSavedSend: "Image saved. Send it along.",
  shareSaved: "Image saved.",
  shareDownloaded: "Saved to photos / downloads.",
  backupOk: "Cold backup done. An empty journal on a new device can restore from this.",
  backupFail: "Backup didn’t finish. Try again later.",
  loginLead: "After you sign in, the journal follows the account across phones.",
  email: "Email",
  password: "Password",
  wait: "One moment…",
  registerLogin: "Create account",
  noAccount: "New here? Create an account",
  hasAccount: "Have an account? Sign in",
  continueWith: "Continue with {name}",
  emailOnly: "Use email on this site. Google / X work in the Grok preview only.",
  seeExamples: "Browse samples first",
  registerFail: "Couldn’t register",
  loginFail: "Couldn’t sign in. Try again.",
  socialFail: "Google / X aren’t available here. Use email.",
  milkWhole: "Whole milk",
  milkOat: "Oat milk",
  milkAlmond: "Almond milk",
  milkSoy: "Soy milk",
  milkCoconut: "Coconut milk",
  heart: "Heart",
  tulip: "Tulip",
  rosetta: "Rosetta",
  swan: "Swan",
  wingedHeart: "Winged heart",
  phoenix: "Phoenix",
  freePour: "Free pour",
  shareTag: "Pour a cup, bloom a flower",
  saveImage: "Save image",
  sendToFriends: "Send",
  downloadShare: "Download",
};

export const messages = { zh, en };

export type MessageKey = keyof typeof zh;

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
) {
  let text: string = messages[locale][key] ?? messages.zh[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function useT() {
  const locale = useLocale();
  return (key: MessageKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}

const PATTERN_KEYS: Record<string, MessageKey> = {
  heart: "heart",
  tulip: "tulip",
  rosetta: "rosetta",
  swan: "swan",
  wingedHeart: "wingedHeart",
  "winged-heart": "wingedHeart",
  phoenix: "phoenix",
  "free-pour": "freePour",
  freePour: "freePour",
};

export function patternLabel(id: string, locale: Locale) {
  const key = PATTERN_KEYS[id];
  return key ? translate(locale, key) : id;
}

const MILK_KEYS: Record<string, MessageKey> = {
  全脂鲜奶: "milkWhole",
  燕麦奶: "milkOat",
  杏仁奶: "milkAlmond",
  豆奶: "milkSoy",
  椰奶: "milkCoconut",
};

export function milkLabel(value: string, locale: Locale) {
  const key = MILK_KEYS[value];
  return key ? translate(locale, key) : value;
}
