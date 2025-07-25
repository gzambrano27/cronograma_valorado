
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SCurveChart } from '@/components/tasks/s-curve-chart';
import type { SCurveData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize } from 'lucide-react';
import { useRef, useState } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface SCurveCardProps {
  valueData: SCurveData[];
  costData: SCurveData[];
}

export function SCurveCard({ valueData, costData }: SCurveCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showCostCurve, setShowCostCurve] = useState(false);

  const activeData = showCostCurve ? costData : valueData;
  const cardTitle = showCostCurve ? 'Curva "S" de Costo' : 'Curva "S" de Avance';
  const cardDescription = showCostCurve 
    ? "Comparación del costo planificado vs. el costo real por proveedor."
    : "Comparación del avance valorado planificado vs. el avance real.";

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline">{cardTitle}</CardTitle>
          <CardDescription>
            {cardDescription}
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="curve-switch" className="text-sm font-medium">Avance</Label>
              <Switch
                id="curve-switch"
                checked={showCostCurve}
                onCheckedChange={setShowCostCurve}
                aria-label="Cambiar entre curva de avance y curva de costo"
              />
              <Label htmlFor="curve-switch" className="text-sm font-medium">Costo</Label>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Maximize className="h-4 w-4" />
                  <span className="sr-only">Agrandar Gráfico</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-headline">{`${cardTitle} (Vista Ampliada)`}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                  <SCurveChart data={activeData} showCostBreakdown={showCostCurve} />
                </div>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pl-2 h-[300px]" ref={chartRef}>
        <SCurveChart data={activeData} showCostBreakdown={showCostCurve} />
      </CardContent>
    </Card>
  );
}
