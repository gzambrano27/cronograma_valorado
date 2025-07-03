
"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect } from "react";
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

// This component handles map events and the marker logic.
// It must be a child of MapContainer to use the useMapEvents hook.
function LocationFinder({ onLocationSelect }: { onLocationSelect: (location: { lat: number; lng: number }) => void }) {
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

  useEffect(() => {
    // This effect runs once when the component mounts and asks for the user's location.
    // The 'map' object from the useMapEvents hook is stable.
    map.locate();
  }, [map]);

  return position === null ? null : <Marker position={position}></Marker>;
}

export function MapPicker({ onLocationSelect }: MapPickerProps) {
  return (
    <MapContainer
      center={[-12.046374, -77.042793]} // Default to Lima, Peru
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationFinder onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
