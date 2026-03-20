'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { anularTicketAction } from '../actions';
import { XCircle, AlertTriangle } from 'lucide-react';

interface Props {
    ticketId: string;
    onClose: () => void;
}

export function AnularTicketModal({ ticketId, onClose }: Props) {
    const router = useRouter();
    const [motivo, setMotivo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleConfirm = async () => {
        if (!motivo.trim()) {
            setErrorMessage('El motivo es obligatorio.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);
        const result = await anularTicketAction(ticketId, motivo);
        setIsSubmitting(false);

        if (result?.error || result?.success === false) {
            setErrorMessage(result.error || 'Ocurrió un error desconocido al anular.');
        } else {
            onClose();
            router.refresh();
            // Fallback to force clear Next.js client cache in case router.refresh is delayed
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-red-100">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Cerrar modal"
                >
                    <XCircle className="w-6 h-6" />
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">¿Anular Ticket?</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Esta acción es irreversible y liberará cualquier material reservado.
                    </p>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200 mb-6 flex items-start gap-2 shadow-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                )}
                
                <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest pl-1">
                            Motivo de la Anulación <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            value={motivo} 
                            onChange={e => setMotivo(e.target.value)} 
                            placeholder="Ej. El problema se resolvió por su cuenta..." 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                            rows={3} 
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-5 py-3 text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        disabled={isSubmitting || !motivo.trim()} 
                        onClick={handleConfirm} 
                        className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isSubmitting ? 'Anulando...' : 'Sí, Anular Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}
