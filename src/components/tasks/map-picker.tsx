
"use client";

import { Map, Marker } from "pigeon-maps";
import { useState } from "react";
import { Button } from "../ui/button";
import { LocateFixed, Loader2 } from "lucide-react";

interface MapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onLocationError: (message: string) => void;
}

export function MapPicker({ onLocationSelect, onLocationError }: MapPickerProps) {
  const [center, setCenter] = useState<[number, number]>([-12.046374, -77.042793]);
  const [zoom, setZoom] = useState(13);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setMarkerPosition(latLng);
    onLocationSelect({ lat: latLng[0], lng: latLng[1] });
  };
  
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      onLocationError("La geolocalización no es compatible con su navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userLocation: [number, number] = [latitude, longitude];
        
        let newZoom = 13;
        if (accuracy < 20) {
            newZoom = 18;
        } else if (accuracy < 50) {
            newZoom = 17;
        } else if (accuracy < 100) {
            newZoom = 16;
        } else if (accuracy < 500) {
            newZoom = 15;
        }

        setCenter(userLocation);
        setZoom(newZoom);
        setMarkerPosition(userLocation);
        onLocationSelect({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error de geolocalización:", error);
        let message = "No se pudo obtener la ubicación. Por favor, seleccione una manualmente.";
        if (error.code === error.PERMISSION_DENIED) {
            message = "Permiso de ubicación denegado. Por favor, habilite los permisos o seleccione una ubicación manualmente."
        }
        onLocationError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative h-full w-full">
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
      <Button
        type="button"
        size="icon"
        className="absolute top-2 right-2 z-[1000] rounded-full shadow-lg"
        onClick={handleLocateMe}
        disabled={isLocating}
        aria-label="Obtener mi ubicación actual"
      >
        {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
            <LocateFixed className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
