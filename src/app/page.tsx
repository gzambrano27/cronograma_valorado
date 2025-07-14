
'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttChartSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Home() {
    const router = useRouter();
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl text-center">
                 <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-headline mb-4">
                    Bienvenido al Centro de Aplicaciones
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Seleccione una herramienta para comenzar. Su panel de control central para la gestión y valoración de proyectos.
                </p>

                <Card 
                    className="group hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => router.push('/dashboard')}
                >
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <GanttChartSquare className="w-8 h-8 text-primary" />
                            <div className="text-left">
                                <CardTitle className="font-headline text-xl">Cronograma Valorado</CardTitle>
                                <CardDescription className="mt-1">
                                    Visualice, gestione y valore sus proyectos y tareas con herramientas de planificación avanzadas.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" asChild>
                            <Link href="/dashboard">Acceder al Cronograma</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
