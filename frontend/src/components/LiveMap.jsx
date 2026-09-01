import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { decodePolyline } from "../utils/polyline";

const restaurantIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#E03546;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customerIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#10B981;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const riderIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div class="rider-marker-pulse" style="width:40px;height:40px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function FitBounds({ positions }) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (fittedRef.current) return;
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      fittedRef.current = true;
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
      fittedRef.current = true;
    }
  }, [positions, map]);

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  const lastRef = useRef(null);

  useEffect(() => {
    if (!center) return;
    if (lastRef.current) {
      const dist = map.latLngToContainerPoint(center).distanceTo(
        map.latLngToContainerPoint(lastRef.current)
      );
      if (dist < 80) return;
    }
    lastRef.current = center;
    map.panTo(center, { animate: true, duration: 0.8 });
  }, [center, map]);

  return null;
}

export default function LiveMap({
  restaurantCoords,
  customerCoords,
  riderLocation,
  polyline,
  className = "",
}) {
  const positions = [];

  if (restaurantCoords) positions.push([restaurantCoords.lat, restaurantCoords.lng]);
  if (customerCoords) positions.push([customerCoords.lat, customerCoords.lng]);
  if (riderLocation) positions.push([riderLocation.lat, riderLocation.lng]);

  const center = positions.length > 0
    ? positions[Math.floor(positions.length / 2)]
    : [23.8103, 90.4125];

  const decodedPolyline = polyline ? decodePolyline(polyline) : null;

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-zinc-200 ${className}`}
      style={{ height: "350px" }}
    >
      <style>{`
        @keyframes riderPulse {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4), 0 2px 8px rgba(0,0,0,0.3); }
          70% { box-shadow: 0 0 0 12px rgba(59,130,246,0), 0 2px 8px rgba(0,0,0,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0), 0 2px 8px rgba(0,0,0,0.3); }
        }
        .rider-marker-pulse { animation: riderPulse 2s infinite; }
        .leaflet-container { border-radius: 12px; z-index: 1; }
      `}</style>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {restaurantCoords && (
          <Marker
            position={[restaurantCoords.lat, restaurantCoords.lng]}
            icon={restaurantIcon}
          />
        )}

        {customerCoords && (
          <Marker
            position={[customerCoords.lat, customerCoords.lng]}
            icon={customerIcon}
          />
        )}

        {riderLocation && (
          <Marker
            position={[riderLocation.lat, riderLocation.lng]}
            icon={riderIcon}
          />
        )}

        {decodedPolyline && (
          <Polyline
            positions={decodedPolyline}
            color="#3B82F6"
            weight={4}
            opacity={0.7}
            dashArray="8 8"
          />
        )}

        {positions.length > 0 && <FitBounds positions={positions} />}
        {riderLocation && <RecenterMap center={[riderLocation.lat, riderLocation.lng]} />}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
        <div className="flex items-center gap-3 text-xs font-medium">
          {restaurantCoords && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E03546]" />
              Restaurant
            </span>
          )}
          {riderLocation && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              Rider
            </span>
          )}
          {customerCoords && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              You
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
