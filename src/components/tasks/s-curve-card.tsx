
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

    // Clonar el SVG para no modificar el original en la página
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

    // Obtener las reglas de estilo CSS de los documentos
    const styleSheets = Array.from(document.styleSheets);
    let allCssRules = '';
    styleSheets.forEach(sheet => {
      try {
        // Algunas hojas de estilo (ej. de Google Fonts) pueden dar error de CORS
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            allCssRules += rule.cssText;
          });
        }
      } catch (e) {
        console.warn('No se pudo leer una hoja de estilos:', e);
      }
    });

    // Crear un elemento <style> para inyectar en el SVG
    const styleElement = document.createElement('style');
    styleElement.textContent = allCssRules;

    // Añadir el <defs> si no existe, y luego el <style>
    let defs = svgClone.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgClone.prepend(defs);
    }
    defs.appendChild(styleElement);


    // Serializar el SVG clonado a un string
    const svgData = new XMLSerializer().serializeToString(svgClone);
    // Crear un Blob (objeto de archivo en memoria)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    // Crear una URL para el Blob
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal para la descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = 'curva-s-avance.svg';
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
        title: "Exportación iniciada",
        description: "La descarga del gráfico ha comenzado.",
    });
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
