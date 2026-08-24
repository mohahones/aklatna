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

export function openSupportLink(link) {
  const appHref = getSupportHref(link);

  if (appHref === (link.webHref ?? link.href) || (!link.appHref && !link.androidAppHref)) {
    return;
  }
}