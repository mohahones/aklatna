export function getSupportHref({ href, webHref, appHref }) {
  const desktopHref = webHref ?? href;

  if (typeof navigator === "undefined") {
    return desktopHref;
  }

  const isIPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || isIPad;

  return isMobile && appHref ? appHref : desktopHref;
}

export function openSupportLink(event, link) {
  const appHref = getSupportHref(link);

  if (appHref === (link.webHref ?? link.href) || !link.appHref) {
    return;
  }

  event.preventDefault();

  let fallbackTimer;
  const cleanup = () => {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener("visibilitychange", cleanup);
    window.removeEventListener("pagehide", cleanup);
  };

  document.addEventListener("visibilitychange", cleanup);
  window.addEventListener("pagehide", cleanup);
  window.location.href = appHref;
  fallbackTimer = window.setTimeout(() => {
    cleanup();
    window.location.href = link.webHref ?? link.href;
  }, 1200);
}