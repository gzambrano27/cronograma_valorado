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

interface SCurveCardProps {
  data: SCurveData[];
}

export function SCurveCard({ data }: SCurveCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline">Curva "S" de Avance</CardTitle>
          <CardDescription>
            Comparación del avance valorado planificado vs. el avance real.
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Maximize className="h-4 w-4" />
              <span className="sr-only">Agrandar Gráfico</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl h-4/5 flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-headline">Curva "S" de Avance (Vista Ampliada)</DialogTitle>
            </DialogHeader>
            <div className="flex-grow min-h-0">
              <SCurveChart data={data} />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pl-2">
        <SCurveChart data={data} />
      </CardContent>
    </Card>
  );
}
