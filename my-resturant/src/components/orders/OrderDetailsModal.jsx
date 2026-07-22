export default function OrderDetailsModal({ selectedOrder, onClose, onConfirm, onCancel, isCancelling }) {
  if (!selectedOrder) return null;

  const canConfirm = selectedOrder.status === "new" && typeof onConfirm === "function";
  const canCancel = selectedOrder.status === "new" && typeof onCancel === "function";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border-subtle animate-in fade-in zoom-in duration-200"
      >
        <div className="p-6 border-b border-border-subtle">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                تفاصيل الطلب <span className="text-primary">{selectedOrder.displayId || selectedOrder.id}</span>
              </h3>
              {selectedOrder.orderType ? (
                <p className="text-sm text-secondary mt-2">نوع الطلب: <span className="text-on-surface font-semibold">{selectedOrder.orderType}</span></p>
              ) : null}
            </div>
            <button onClick={onClose} className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div>
            <h4 className="text-[10px] text-secondary uppercase font-bold mb-2">معلومات العميل</h4>
            <p className="text-base font-bold">{selectedOrder.customer}</p>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined">phone</span> {selectedOrder.phone || "+966 50 123 4567"}
              </p>
              <p className="text-xs text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined">place</span> {selectedOrder.address || "حي النرجس، الرياض"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] text-secondary uppercase font-bold">الأصناف</h4>
              <span className="text-[10px] bg-surface-container-low px-2 py-0.5 rounded">{selectedOrder.items} أصناف</span>
            </div>
            <ul className="space-y-4">
              {(selectedOrder.itemsList || []).map((item, index) => {
                const itemName = item.name_ar || item.name || item.title || "عنصر";
                const quantity = Number(item.quantity ?? item.qty ?? 1);
                const itemPrice = Number(item.price ?? item.unit_price ?? 0);
                const itemTotal = (itemPrice * quantity).toFixed(2);

                return (
                  <li key={`${item.id || index}-${itemName}`} className="space-y-2">
                    <div className="flex justify-between gap-4 text-sm">
                      <div>
                        <p className="text-on-surface font-semibold">{itemName}</p>
                        <p className="text-secondary text-[11px] mt-1">الكمية: {quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-on-surface">${itemTotal}</p>
                      </div>
                    </div>

                    {item.note ? (
                      <p className="text-secondary text-[11px]">ملاحظة: {item.note}</p>
                    ) : null}

                    {Array.isArray(item.addons) && item.addons.length > 0 ? (
                      <div className="rounded-lg bg-surface-container-low p-3 border border-border-subtle">
                        <div className="text-[11px] text-secondary uppercase font-bold mb-2">إضافات</div>
                        <ul className="space-y-2">
                          {item.addons.map((addon) => (
                            <li key={addon.id || addon.name} className="flex justify-between text-[12px] text-secondary">
                              <span>{addon.name || addon.title || "إضافة"}</span>
                              <span>${Number(addon.price ?? 0).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] text-secondary uppercase font-bold mb-2">تفاصيل الطلب</h4>
            <textarea
              readOnly
              value={selectedOrder.details || "لا توجد تفاصيل إضافية."}
              className="w-full rounded-lg border-border-subtle bg-surface-container-low text-sm p-3 min-h-[80px] resize-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <div className="flex justify-between text-base font-bold text-primary">
              <span>الإجمالي</span>
              <span>${selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="p-6 bg-surface-container-low flex gap-3">
          {canConfirm ? (
            <>
              <button onClick={onConfirm} className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all">تأكيد وقبول الطلب</button>
              <button
                onClick={onCancel}
                disabled={!canCancel || isCancelling}
                className={`px-6 py-3 border border-border-subtle bg-surface-container-lowest rounded-lg text-secondary font-bold hover:bg-surface-container-low transition-colors text-sm ${isCancelling ? "cursor-wait opacity-70" : "hover:opacity-90"}`}
              >
                {isCancelling ? "جاري الإلغاء..." : "إلغاء الطلب"}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all">إغلاق</button>
          )}
        </div>
      </div>
    </div>
  );
}
