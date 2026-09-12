import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { NoticeHost } from "@/components/notice-host";
import { getLocale, translate, useLocale } from "@/lib/i18n";
import appCss from "../styles.css?url";

const APP_NAME = "杯中花";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: getLocale() === "en" ? "Bloom Latte" : APP_NAME },
      { name: "theme-color", content: "#f3ece4" },
      { name: "apple-mobile-web-app-title", content: "Bloom Latte" },
      { name: "application-name", content: "Bloom Latte" },
      {
        name: "description",
        content: "杯中花 · 记录每一次拉花。照片、图案、豆子与评分，装进一本咖啡手记。",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&family=Noto+Serif+SC:wght@500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function LangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = translate(locale, "bloom");
  }, [locale]);
  return null;
}

function RootDocument() {
  const lang = getLocale() === "en" ? "en" : "zh-CN";
  return (
    <html lang={lang} className="antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var K="bloom_chunk_reload_ts";
  function reload(){
    try{
      var last=sessionStorage.getItem(K);
      var now=Date.now();
      if(!last||now-Number(last)>10000){
        sessionStorage.setItem(K,String(now));
        window.location.reload();
      }
    }catch(e){}
  }
  window.addEventListener("vite:preloadError",function(){reload();});
  window.addEventListener("error",function(e){
    var m=(e&&(e.message||(e.error&&e.error.message)))||"";
    if(typeof m==="string"&&(
      m.indexOf("importing a module script failed")!==-1||
      m.indexOf("dynamically imported module")!==-1||
      m.indexOf("Failed to fetch dynamically imported module")!==-1
    )){
      reload();
    }
  });
  window.addEventListener("unhandledrejection",function(e){
    var r=e&&e.reason;
    var m=(r&&(r.message||(typeof r==="string"?r:"")))||"";
    if(typeof m==="string"&&(
      m.indexOf("importing a module script failed")!==-1||
      m.indexOf("dynamically imported module")!==-1||
      m.indexOf("Failed to fetch dynamically imported module")!==-1
    )){
      reload();
    }
  });
})();
`,
          }}
        />
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <LangSync />
          <Outlet />
          <NoticeHost />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
