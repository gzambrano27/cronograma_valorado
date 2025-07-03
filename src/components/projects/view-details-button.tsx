"use client";

import { Button } from "@/components/ui/button";

export function ViewDetailsButton() {
  return (
    <Button variant="secondary" size="sm" asChild>
      <div onClick={(e) => e.preventDefault()}>Ver Detalles</div>
    </Button>
  );
}
