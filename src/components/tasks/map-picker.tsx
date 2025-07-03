
"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src
});


interface MapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

// This component now only handles events and the marker
function LocationMarker({ onLocationSelect }: { onLocationSelect: (location: { lat: number; lng: number }) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect(e.latlng);
    },
  });

  // The useEffect for map.locate() has been removed from here
  // to ensure it's called only after the map is fully ready.

  return position === null ? null : <Marker position={position}></Marker>;
}

export function MapPicker({ onLocationSelect }: MapPickerProps) {
  return (
    <MapContainer
      center={[-12.046374, -77.042793]} // Default to Lima, Peru
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      whenReady={(mapInstance) => {
        // This function runs only after the map has been fully initialized and displayed.
        // Now we ask for the user's location.
        mapInstance.target.locate();
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
