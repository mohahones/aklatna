export function getSupportHref({ href, webHref, appHref, androidAppHref }) {
  const desktopHref = webHref ?? href;

  if (typeof navigator === "undefined") {
    return desktopHref;
  }

  const isIPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isAndroid || /iPhone|iPad|iPod/i.test(navigator.userAgent) || isIPad;

  if (isAndroid && androidAppHref) {
    return androidAppHref;
  }

  return isMobile && appHref ? appHref : desktopHref;
}

export function openSupportLink(event, link) {
  const appHref = getSupportHref(link);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (appHref === (link.webHref ?? link.href) || (!link.appHref && !link.androidAppHref)) {
    return;
  }

  event.preventDefault();
  window.location.assign(appHref);

  // Android intent URLs handle their own browser fallback.
  if (isAndroid) {
    return;
  }

  let fallbackTimer;
  const cleanup = () => {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener("visibilitychange", cleanup);
    window.removeEventListener("pagehide", cleanup);
  };

  document.addEventListener("visibilitychange", cleanup);
  window.addEventListener("pagehide", cleanup);
  fallbackTimer = window.setTimeout(() => {
    cleanup();
    window.location.href = link.webHref ?? link.href;
  }, 3000);
}