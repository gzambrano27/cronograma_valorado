
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
import { Maximize, Download } from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SCurveCardProps {
  data: SCurveData[];
}

export function SCurveCard({ data }: SCurveCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    const svgElement = chartRef.current?.querySelector('svg');
    if (!svgElement) {
      toast({
        variant: 'destructive',
        title: 'Error al exportar',
        description: 'No se pudo encontrar el gráfico para exportar.',
      });
      return;
    }

    try {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; // Aumentar escala para mayor resolución
            canvas.width = (svgElement.clientWidth || 600) * scale;
            canvas.height = (svgElement.clientHeight || 300) * scale;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                 // Dibuja un fondo blanco para evitar transparencias
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = 'curva-s-avance.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                toast({
                    title: "Exportación Completa",
                    description: "La imagen del gráfico ha sido descargada.",
                });
            }
        };
        image.onerror = () => {
             URL.revokeObjectURL(url);
             toast({
                variant: 'destructive',
                title: 'Error al cargar el gráfico',
                description: 'No se pudo procesar la imagen del gráfico para la exportación.',
             });
        }
        image.src = url;

    } catch (error) {
        console.error("Error exporting chart:", error);
        toast({
            variant: "destructive",
            title: "Error inesperado",
            description: "Ocurrió un error durante la exportación del gráfico."
        })
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline">Curva "S" de Avance</CardTitle>
          <CardDescription>
            Comparación del avance valorado planificado vs. el avance real.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Exportar Gráfico</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Maximize className="h-4 w-4" />
                  <span className="sr-only">Agrandar Gráfico</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-headline">Curva "S" de Avance (Vista Ampliada)</DialogTitle>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                  <SCurveChart data={data} />
                </div>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pl-2 h-[300px]" ref={chartRef}>
        <SCurveChart data={data} />
      </CardContent>
    </Card>
  );
}
