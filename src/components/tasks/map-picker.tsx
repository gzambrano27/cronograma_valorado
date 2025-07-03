"use client";

import { Map, Marker } from "pigeon-maps";
import { useState, useEffect } from "react";

interface MapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onLocationError: (message: string) => void;
}

export function MapPicker({ onLocationSelect, onLocationError }: MapPickerProps) {
  const [center, setCenter] = useState<[number, number]>([-12.046374, -77.042793]);
  const [zoom, setZoom] = useState(13);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!navigator.geolocation) {
      onLocationError("La geolocalización no es compatible con su navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          const { latitude, longitude } = position.coords;
          const userLocation: [number, number] = [latitude, longitude];
          setCenter(userLocation);
          setZoom(16);
          setMarkerPosition(userLocation);
          onLocationSelect({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        console.error("Error de geolocalización:", error);
        let message = "No se pudo obtener la ubicación. Por favor, seleccione una manualmente.";
        if (error.code === error.PERMISSION_DENIED) {
            message = "Permiso de ubicación denegado. Por favor, habilite los permisos o seleccione una ubicación manualmente."
        }
        onLocationError(message);
      }
    );
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setMarkerPosition(latLng);
    onLocationSelect({ lat: latLng[0], lng: latLng[1] });
  };
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Map
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
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
