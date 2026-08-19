import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png?url";
import markerIcon from "leaflet/dist/images/marker-icon.png?url";
import markerShadow from "leaflet/dist/images/marker-shadow.png?url";

const defaultCenter = { lat: 33.4531651, lng: 36.2440305 };
const defaultZoom = 13;

if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function getCenter(coords) {
  return coords ? { lat: Number(coords.lat), lng: Number(coords.lng) } : defaultCenter;
}

function addTileLayer(map) {
  return L.tileLayer("https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    attribution: "&copy; Google Maps",
    maxNativeZoom: 20,
    maxZoom: 22,
  }).addTo(map);
}

const locationMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "restaurant-location-marker",
});

export default function LocationPicker({ initialCoords, onLocationChange }) {
  const previewRef = useRef(null);
  const editorRef = useRef(null);
  const previewMapRef = useRef(null);
  const previewMarkerRef = useRef(null);
  const editorMapRef = useRef(null);
  const editorMarkerRef = useRef(null);
  const locationWatchRef = useRef(null);
  const locationTimeoutRef = useRef(null);
  const callbackRef = useRef(onLocationChange);
  const selectedCoordsRef = useRef(getCenter(initialCoords));
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [draftCoords, setDraftCoords] = useState(getCenter(initialCoords));
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [requiresAccurateLocation, setRequiresAccurateLocation] = useState(false);

  useEffect(() => {
    callbackRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!initialCoords) return;
    const nextCoords = getCenter(initialCoords);
    selectedCoordsRef.current = nextCoords;
    previewMarkerRef.current?.setLatLng(nextCoords);
    previewMapRef.current?.setView(nextCoords, defaultZoom);
  }, [initialCoords]);

  useEffect(() => {
    if (!previewRef.current) return;
    const center = getCenter(initialCoords);
    const map = L.map(previewRef.current, {
      center,
      zoom: defaultZoom,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      attributionControl: false,
      zoomControl: false,
    });
    addTileLayer(map);
    previewMarkerRef.current = L.marker(center, { draggable: false, icon: locationMarkerIcon }).addTo(map);
    previewMapRef.current = map;

    return () => {
      map.remove();
      previewMapRef.current = null;
      previewMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isFullScreen || !editorRef.current) return;

    const center = selectedCoordsRef.current;
    const map = L.map(editorRef.current, {
      center,
      zoom: 17,
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: false,
    });
    addTileLayer(map);
    const marker = L.marker(center, { draggable: true, icon: locationMarkerIcon }).addTo(map);
    editorMapRef.current = map;
    editorMarkerRef.current = marker;
    setDraftCoords(center);

    const updateDraft = (coords) => {
      const nextCoords = { lat: coords.lat, lng: coords.lng };
      setRequiresAccurateLocation(false);
      setDraftCoords(nextCoords);
      marker.setLatLng(nextCoords);
      map.setView(nextCoords, Math.max(map.getZoom(), 17));
    };

    map.on("click", (event) => updateDraft(event.latlng));
    marker.on("dragend", (event) => updateDraft(event.target.getLatLng()));

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      editorMapRef.current = null;
      editorMarkerRef.current = null;
    };
  }, [isFullScreen]);

  const confirmLocation = async () => {
    if (requiresAccurateLocation && (locationAccuracy === null || locationAccuracy > 10)) return;
    const coords = draftCoords;
    selectedCoordsRef.current = coords;
    previewMarkerRef.current?.setLatLng(coords);
    previewMapRef.current?.setView(coords, defaultZoom);
    callbackRef.current?.(null, coords);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=ar`
      );
      const data = await response.json();
      callbackRef.current?.(data.display_name || "مكان محدد", coords);
    } catch (error) {
      console.error(error);
    }

    setIsFullScreen(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("تحديد الموقع غير متاح في هذا المتصفح.");
      return;
    }

    setIsLocating(true);
    setLocationError("");
    setLocationAccuracy(null);
    setRequiresAccurateLocation(true);
    let bestAccuracy = Number.POSITIVE_INFINITY;

    const stopWatching = () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
        locationTimeoutRef.current = null;
      }
      setIsLocating(false);
    };

    locationWatchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (coords.accuracy >= bestAccuracy) return;
        bestAccuracy = coords.accuracy;
        const nextCoords = { lat: coords.latitude, lng: coords.longitude };
        editorMarkerRef.current?.setLatLng(nextCoords);
        editorMapRef.current?.setView(nextCoords, 18);
        setDraftCoords(nextCoords);
        setLocationAccuracy(Math.round(coords.accuracy));
        if (coords.accuracy <= 10) stopWatching();
      },
      () => {
        stopWatching();
        setLocationError("تعذر تحديد موقعك. اسمح بالوصول للموقع وحاول مرة أخرى.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    locationTimeoutRef.current = setTimeout(() => {
      if (bestAccuracy > 10) {
        setLocationError("لم تصل دقة الموقع إلى 10 أمتار. استخدم الهاتف أو اختر الموقع يدويًا.");
      }
      stopWatching();
    }, 20000);
  };

  useEffect(() => () => {
    if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
    if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
  }, []);

  return (
    <div className="space-y-3">
      <div
        onClick={() => setIsFullScreen(true)}
        className="map-wrapper block h-64 w-full cursor-pointer overflow-hidden rounded-xl border border-border-subtle relative text-right"
        role="button"
        tabIndex={0}
        aria-label="فتح الخريطة لاختيار الموقع"
      >
        <div ref={previewRef} className="h-full w-full bg-surface-container-low" />
      </div>

      {isFullScreen && (
        <div className="map-editor-overlay" role="dialog" aria-modal="true" aria-label="اختيار موقع المطعم">
          <div ref={editorRef} className="map-editor-canvas" />
          <div className="fixed left-4 top-4 z-[20002] flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-on-surface shadow-lg disabled:cursor-wait disabled:opacity-70"
            >
              {isLocating ? "جاري تحديد موقعي..." : "استخدام موقعي الحالي"}
            </button>
            {locationError && (
              <p className="rounded-lg bg-white/95 px-3 py-2 text-xs text-error shadow-lg" role="alert">
                {locationError}
              </p>
            )}
            {isLocating && locationAccuracy !== null && (
              <p className="rounded-lg bg-white/95 px-3 py-2 text-xs text-on-surface shadow-lg">
                الدقة الحالية: {locationAccuracy} متر
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={confirmLocation}
            disabled={requiresAccurateLocation && (isLocating || locationAccuracy === null || locationAccuracy > 10)}
            className="fullscreen-close-btn rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-on-surface shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requiresAccurateLocation && (isLocating || locationAccuracy === null || locationAccuracy > 10)
              ? "بانتظار دقة 10 أمتار..."
              : "تأكيد وإغلاق الخريطة"}
          </button>
        </div>
      )}
    </div>
  );
}
