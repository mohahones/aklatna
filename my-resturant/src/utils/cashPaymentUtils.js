export const STATUS_META = {
  pending: {
    label: "بانتظار التأكيد",
    tone: "text-pending-amber",
    dot: "bg-pending-amber",
  },
  accepted: {
    label: "مقبول",
    tone: "text-success-green",
    dot: "bg-success-green",
  },
  rejected: {
    label: "مرفوض",
    tone: "text-error-red",
    dot: "bg-error-red",
  },
};

export function mapBusinessRowToRequest(row) {
  return {
    id: row.id,
    restaurantName: row.name_ar || row.name || "مطعم غير مسجل",
    name: row.name || row.name_ar || "",
    phone: row.phone || "",
    address: row.address || "لا يوجد عنوان",
    isActive: Boolean(row.is_active),
    is_active: row.is_active,
    createdAt: row.created_at || null,
    created_at: row.created_at || null,
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—",
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    amount: 10,
    status: row.is_active ? "accepted" : "pending",
  };
}

export function isSameDay(firstDate, secondDate) {
  if (!firstDate || !secondDate) {
    return false;
  }

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}
