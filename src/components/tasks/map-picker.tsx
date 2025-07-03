
"use client";

import { Map, Marker } from "pigeon-maps";
import { useState, useEffect } from "react";

interface MapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

export function MapPicker({ onLocationSelect }: MapPickerProps) {
  const [center, setCenter] = useState<[number, number]>([-12.046374, -77.042793]);
  const [zoom, setZoom] = useState(13);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
          setZoom(15);
        },
        () => {
          console.error("No se pudo obtener la geolocalización.");
        }
      );
    }
  }, []);

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setMarkerPosition(latLng);
    onLocationSelect({ lat: latLng[0], lng: latLng[1] });
  };
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Map
        center={center}
        zoom={zoom}
        onClick={handleMapClick}
      >
        {markerPosition && (
          <Marker 
            width={40} 
            anchor={markerPosition} 
            color="hsl(var(--primary))"
          />
        )}
      </Map>
    </div>
  );
}
