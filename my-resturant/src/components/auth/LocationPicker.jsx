import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import ConfirmModal from "../ui/ConfirmModal";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png?url";
import markerIcon from "leaflet/dist/images/marker-icon.png?url";
import markerShadow from "leaflet/dist/images/marker-shadow.png?url";

const defaultCenter = { lat: 24.7136, lng: 46.6753 };
const defaultZoom = 12;

// Fix leaflet default icon paths for Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function LocationPicker({ address, initialCoords, onLocationChange }) {
  const mapRef = useRef(null);
  const wrapperRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const callbackRef = useRef(onLocationChange);
  const lastGeoRef = useRef(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState("اختر الموقع من الخريطة أو استخدم موقعي الحالي.");
  const fullscreenHostRef = useRef(null);
  const originalParentRef = useRef(null);

  useEffect(() => {
    callbackRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!mapRef.current) return;

    const center = initialCoords ? { lat: initialCoords.lat, lng: initialCoords.lng } : defaultCenter;
    const map = L.map(mapRef.current, {
      center,
      zoom: defaultZoom,
      scrollWheelZoom: true,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution: "&copy; Google Maps",
      maxNativeZoom: 20,
      maxZoom: 22,
    }).addTo(map);

    const initialMarker = L.marker(center, { draggable: true }).addTo(map);
    markerRef.current = initialMarker;

    const updateLocation = async ({ lat, lng }) => {
      setStatus("جاري الحصول على العنوان...");
      callbackRef.current?.(null, { lat, lng });

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`
        );
        const data = await response.json();
        const label = data.display_name || "مكان محدد";
        callbackRef.current?.(label, { lat, lng });
        setStatus("تم اختيار الموقع. يمكنك تعديل العنوان أو تحريك الدبوس.");
      } catch (error) {
        console.error(error);
        setStatus("لم يتم جلب العنوان تلقائياً، الرجاء إدخاله يدوياً.");
      }
    };

    map.on("click", async (event) => {
      // إذا كنا في وضع full-screen: استخدام النقر مباشرةً لتحديد الموقع
      if (isFullScreen) {
        const { lat, lng } = event.latlng;
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 18);
        initialMarker.setLatLng(event.latlng);
        await updateLocation({ lat, lng });
        return;
      }

      // إذا سبق وتم استخدام موقع الجهاز الآن، اسأل المستخدم هل يريد تغيير موقعه
      if (lastGeoRef.current) {
        setConfirmOpen(true);
        return;
      }

      // لم يُستخدم الموقع بعد — اطلب إذن الموقع من المتصفح
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            lastGeoRef.current = true;
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([lat, lng], 18);
            }
            initialMarker.setLatLng([lat, lng]);
            await updateLocation({ lat, lng });
          },
          async () => {
            // رفض الإذن أو خطأ: افتح الخريطة بملء الشاشة لاختيار يدوي
            const { lat, lng } = event.latlng;
            if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 18);
            initialMarker.setLatLng(event.latlng);
            await updateLocation({ lat, lng });
            setIsFullScreen(true);
            setStatus("لم يتم منح إذن الموقع — الرجاء اختيار الموقع يدوياً.");
          },
          { timeout: 10000 }
        );
      } else {
        const { lat, lng } = event.latlng;
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 18);
        initialMarker.setLatLng(event.latlng);
        await updateLocation({ lat, lng });
        setIsFullScreen(true);
      }
    });

    initialMarker.on("moveend", async (event) => {
      const { lat, lng } = event.target.getLatLng();
      await updateLocation({ lat, lng });
    });

    return () => {
      map.remove();
    };
  }, [initialCoords]);

  useEffect(() => {
    // Move the map element into a fullscreen host appended to body to avoid parent stacking/transform issues
    const mapEl = mapRef.current;
    if (!mapEl) return;

    if (isFullScreen) {
      // save original parent to restore later
      if (!originalParentRef.current) {
        originalParentRef.current = mapEl.parentNode;
      }
      // create host
      const host = document.createElement("div");
      host.className = "locationpicker-fullscreen-host";
      Object.assign(host.style, {
        position: "fixed",
        inset: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "20000",
        background: "transparent",
        display: "flex",
        alignItems: "stretch",
      });
      document.body.appendChild(host);
      fullscreenHostRef.current = host;

      // move map element into host
      host.appendChild(mapEl);
      document.body.style.overflow = "hidden";
    } else {
      // restore map element to original parent
      if (fullscreenHostRef.current) {
        const host = fullscreenHostRef.current;
        if (originalParentRef.current) {
          originalParentRef.current.appendChild(mapEl);
        }
        host.remove();
        fullscreenHostRef.current = null;
      }
      document.body.style.overflow = "";
    }

    return () => {
      // cleanup: ensure map element is restored
      if (fullscreenHostRef.current) {
        const host = fullscreenHostRef.current;
        if (originalParentRef.current) {
          originalParentRef.current.appendChild(mapEl);
        }
        host.remove();
        fullscreenHostRef.current = null;
      }
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      // small delay to allow layout to settle after moving element
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 120);
    }
  }, [isFullScreen]);

  
  // keep variables referenced to avoid unused-var warnings (hidden UI)
  useEffect(() => {
    console.debug("LocationPicker debug:", { status, address });
  }, [status, address]);

  return (
    <div className="space-y-3">
      <div ref={wrapperRef} className={`map-wrapper rounded-xl border border-border-subtle overflow-hidden relative ${isFullScreen ? "map-fullscreen" : ""}`}>
        <div ref={mapRef} className={`h-64 w-full bg-surface-container-low ${isFullScreen ? "h-full" : ""}`} />
      </div>
      {/* status hidden by user request */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="هل تريد تغيير موقعك؟"
        description="هل تريد تحديد موقع مختلف عن موقعك الحالي؟ اختر نعم لفتح الخريطة وتعديل الموقع يدوياً."
        confirmLabel="نعم"
        cancelLabel="لا"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          // Open fullscreen first so map sits above the modal overlay
          setIsFullScreen(true);
          // small delay to allow CSS to apply, then resize & recenter
          setTimeout(() => {
            const map = mapInstanceRef.current;
            const mk = markerRef.current;
            if (map) map.invalidateSize();
            if (map && mk) {
              const { lat, lng } = mk.getLatLng();
              map.setView([lat, lng], 18);
            }
            // finally close the modal
            setConfirmOpen(false);
          }, 250);
        }}
      />
      {isFullScreen && (
        <button
          type="button"
          onClick={async () => {
            const mk = markerRef.current;
            if (mk) {
              const { lat, lng } = mk.getLatLng();
              try {
                setStatus("جاري الحصول على العنوان...");
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`
                );
                const data = await response.json();
                const label = data.display_name || "مكان محدد";
                callbackRef.current?.(label, { lat, lng });
                setStatus("تم اختيار الموقع. يمكنك تعديل العنوان أو تحريك الدبوس.");
              } catch (err) {
                console.error(err);
                setStatus("لم يتم جلب العنوان تلقائياً، الرجاء إدخاله يدوياً.");
              }
            }
            setIsFullScreen(false);
          }}
          className="fullscreen-close-btn rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-on-surface shadow-lg"
          style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 30000 }}
        >
          تأكيد وإغلاق الخريطة
        </button>
      )}
      {/* extracted address hidden by user request */}
    </div>
  );
}
