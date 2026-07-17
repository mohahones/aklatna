export function formatDate(value) {
  if (!value) return "غير محدد";
  return new Date(value).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value) {
  if (!value) return { date: "غير محدد", time: "" };
  return { date: formatDate(value), time: formatTime(value) };
}

export function getRemainingTime(expiresAt, now) {
  if (!expiresAt) {
    return { label: "غير محدد", isExpired: false, milliseconds: Number.POSITIVE_INFINITY };
  }

  const expiresTime = new Date(expiresAt).getTime();
  const remainingMs = expiresTime - now.getTime();

  if (remainingMs <= 0) {
    const sinceMs = now.getTime() - expiresTime;
    const days = Math.floor(sinceMs / 86400000);
    const hours = Math.floor((sinceMs % 86400000) / 3600000);
    const minutes = Math.floor((sinceMs % 3600000) / 60000);

    const parts = [];
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (days === 0 && hours === 0 && minutes === 0) parts.push("أقل من دقيقة");
    else if (minutes > 0) parts.push(`${minutes} دقيقة`);

    return { label: `انتهى منذ ${parts.join(" ")}`, isExpired: true, milliseconds: remainingMs };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (days === 0 && hours === 0 && minutes === 0) parts.push(`${seconds} ثانية`);

  return { label: `متبقي ${parts.join(" ")}`, isExpired: false, milliseconds: remainingMs };
}
