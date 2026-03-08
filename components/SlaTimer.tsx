'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
    vencimientoSla: string | null;
    estado: string;
    actualizadoEn?: string | null;
    fechaResolucion?: string | null;
}

export default function SlaTimer({ vencimientoSla, estado, actualizadoEn, fechaResolucion }: Props) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [colorClass, setColorClass] = useState<string>('bg-gray-100 text-gray-700');

    useEffect(() => {
        if (!vencimientoSla) return;

        if (estado === 'programado') {
            setTimeLeft('SLA Pausado - Visita Programada');
            setColorClass('bg-purple-100 text-purple-700 border-purple-200');
            return;
        }

        const isResolved = estado === 'resuelto' || estado === 'cerrado';
        const slaDate = new Date(vencimientoSla).getTime();

        const calculateTime = () => {
            let resolutionDate = new Date().getTime();
            if (isResolved) {
                if (fechaResolucion) resolutionDate = new Date(fechaResolucion).getTime();
                else if (actualizadoEn) resolutionDate = new Date(actualizadoEn).getTime();
            }

            const now = isResolved ? resolutionDate : new Date().getTime();

            // Check for Invalid Date
            if (isNaN(now) || isNaN(slaDate)) {
                setTimeLeft('Error de cálculo SLA');
                setColorClass('bg-gray-100 text-gray-500 border border-gray-200');
                return;
            }

            const diffMs = slaDate - now;

            if (isResolved) {
                if (diffMs >= 0) {
                    setTimeLeft('SLA Cumplido');
                    setColorClass('bg-green-100 text-green-700 border border-green-200');
                } else {
                    setTimeLeft('SLA Incumplido');
                    setColorClass('bg-red-100 text-red-700 border border-red-200');
                }
                return;
            }

            const absDiff = Math.abs(diffMs);
            const hours = Math.floor(absDiff / (1000 * 60 * 60));
            const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

            const format = (n: number) => n.toString().padStart(2, '0');
            const timeString = `${format(hours)}:${format(minutes)}:${format(seconds)}`;

            if (diffMs < 0) {
                setTimeLeft(`Vencido hace ${timeString}`);
                setColorClass('bg-red-100 text-red-700 animate-pulse border border-red-200');
            } else if (diffMs <= 2 * 60 * 60 * 1000) {
                setTimeLeft(`Vence en ${timeString}`);
                setColorClass('bg-yellow-100 text-yellow-800 border border-yellow-200');
            } else {
                setTimeLeft(`A tiempo: ${timeString}`);
                setColorClass('bg-green-100 text-green-700 border border-green-200');
            }
        };

        calculateTime();
        if (!isResolved) {
            const timer = setInterval(calculateTime, 1000);
            return () => clearInterval(timer);
        }
    }, [vencimientoSla, estado, actualizadoEn]);

    if (!vencimientoSla) return null;

    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm transition-colors ${colorClass}`}>
            <Clock className="w-4 h-4 mr-2" />
            {timeLeft}
        </span>
    );
}
