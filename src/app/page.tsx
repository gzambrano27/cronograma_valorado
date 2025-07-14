
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

                <div className="flex justify-center">
                    <Card 
                        className="group hover:bg-muted/40 transition-colors cursor-pointer w-72"
                        onClick={() => router.push('/dashboard')}
                    >
                        <CardContent className="flex flex-col items-center text-center p-6">
                            <GanttChartSquare className="w-16 h-16 text-primary mb-4" />
                            <CardTitle className="font-headline text-xl mb-2">Cronograma Valorado</CardTitle>
                            <CardDescription>
                                Visualice, gestione y valore sus proyectos y tareas.
                            </CardDescription>
                            <Button className="mt-6 w-full" asChild>
                                <Link href="/dashboard">Acceder</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
