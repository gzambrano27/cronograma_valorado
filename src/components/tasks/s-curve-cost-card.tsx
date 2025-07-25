
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
import { SCurveCostChart } from '@/components/tasks/s-curve-cost-chart';
import type { SCurveData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize } from 'lucide-react';
import { useRef } from 'react';

interface SCurveCostCardProps {
  data: SCurveData[];
}

export function SCurveCostCard({ data }: SCurveCostCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline">Curva "S" de Costo</CardTitle>
          <CardDescription>
            Comparación del costo planificado, el costo real y el desglose por proveedor.
          </CardDescription>
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
              <DialogTitle className="font-headline">Curva "S" de Costo (Vista Ampliada)</DialogTitle>
            </DialogHeader>
            <div className="flex-grow min-h-0">
              <SCurveCostChart data={data} />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pl-2 h-[300px]" ref={chartRef}>
        <SCurveCostChart data={data} />
      </CardContent>
    </Card>
  );
}
