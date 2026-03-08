'use client';

import { useState } from 'react';
import { updateTicketPropertiesAction, assignTicketToMeAction } from '../actions';
import { AlertCircle, Clock, CheckCircle2, XCircle, ChevronDown, Activity, Flag, UserPlus, Calendar } from 'lucide-react';
import { TicketStatus } from '@/types/database.types';
import SlaTimer from '@/components/SlaTimer';

interface Props {
    ticket: any;
    isAgent: boolean;
}

export default function TicketSidebar({ ticket, isAgent }: Props) {
    const [isUpdating, setIsUpdating] = useState(false);

    // Hardcode possible states to make rendering easier
    const statuses: { id: TicketStatus, label: string, color: string, icon: any }[] = [
        { id: 'esperando_agente', label: 'Sin Asignar', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle },
        { id: 'abierto', label: 'Abierto', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: AlertCircle },
        { id: 'pendiente', label: 'Pendiente', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
        { id: 'programado', label: 'Programado', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Calendar },
        { id: 'en_progreso', label: 'En Progreso', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Activity },
        { id: 'resuelto', label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        { id: 'cerrado', label: 'Cerrado', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle }
    ];

    const priorities = [
        { id: 'baja', label: 'Baja', color: 'text-blue-600' },
        { id: 'media', label: 'Media', color: 'text-amber-500' },
        { id: 'alta', label: 'Alta', color: 'text-red-600' },
        { id: 'crítica', label: 'Crítica', color: 'text-purple-700' }
    ];

    const currentStatusMenu = statuses.find(s => s.id === ticket.estado) || statuses[0];
    const StatusIcon = currentStatusMenu.icon;

    const [statusOpen, setStatusOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);

    const handleUpdate = async (field: 'estado' | 'prioridad', value: string) => {
        setIsUpdating(true);
        setStatusOpen(false);
        setPriorityOpen(false);
        try {
            const updates = { [field]: value };
            const result = await updateTicketPropertiesAction(ticket.id, updates);
            if (result.error) {
                alert(result.error);
            }
        } catch (error) {
            console.error('Update failed', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8 flex flex-col max-h-[calc(100vh-6rem)]">
            <div className="bg-gray-50/50 p-4 border-b border-gray-200 rounded-t-2xl shrink-0">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    Propiedades
                </h3>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {/* ASSIGNMENT SECTION */}
                {isAgent && ticket.estado !== 'cerrado' ? (
                    <div className="p-5 border-b border-gray-50">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Asignación</span>
                        {!ticket.agente_asignado_id ? (
                            <button
                                onClick={async () => {
                                    setIsUpdating(true);
                                    await assignTicketToMeAction(ticket.id);
                                    setIsUpdating(false);
                                }}
                                disabled={isUpdating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-brand-secondary transition-all disabled:opacity-50"
                            >
                                <UserPlus className="w-4 h-4" />
                                Asignarme este ticket
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                    {ticket.agente?.full_name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Agente asignado</span>
                                    <span className="font-bold text-sm text-gray-900 leading-tight">{ticket.agente?.full_name || 'Agente'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    !isAgent && ticket.agente_asignado_id && (
                        <div className="p-5 border-b border-gray-50">
                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Agente a cargo</span>
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                    {ticket.agente?.full_name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <span className="font-bold text-sm text-gray-900">{ticket.agente?.full_name}</span>
                            </div>
                        </div>
                    )
                )}

                {/* STATUS SECTION */}
                <div className="p-5 border-b border-gray-50">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estado del Ticket</span>

                    {isAgent && ticket.estado !== 'cerrado' ? (
                        <div className="relative">
                            <button
                                onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); }}
                                disabled={isUpdating}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border font-bold text-sm transition-all shadow-sm ${currentStatusMenu.color} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95 cursor-pointer'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <StatusIcon className="w-4 h-4" />
                                    {currentStatusMenu.label}
                                </span>
                                <ChevronDown className="w-4 h-4 opacity-70" />
                            </button>

                            {statusOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setStatusOpen(false)}></div>
                                    <div className="absolute z-40 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1.5 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                                        {statuses.filter(s => s.id !== 'cerrado').map(s => {
                                            const Icon = s.icon;
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleUpdate('estado', s.id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                >
                                                    <div className={`p-1.5 rounded-lg border ${s.color}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className={s.id === ticket.estado ? 'text-indigo-900 font-bold' : 'text-gray-700'}>
                                                        {s.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl border font-bold text-sm shadow-sm ${currentStatusMenu.color}`}>
                            <StatusIcon className="w-4 h-4 mr-2" />
                            {currentStatusMenu.label}
                        </div>
                    )}
                </div>

                {/* PRIORITY SECTION */}
                <div className="p-5 border-b border-gray-50">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Prioridad</span>

                    {isAgent && ticket.estado !== 'cerrado' ? (
                        <div className="relative">
                            <button
                                onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); }}
                                disabled={isUpdating}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-sm transition-all shadow-sm hover:bg-gray-50 text-gray-900"
                            >
                                <span className="flex items-center gap-2 capitalize">
                                    <Flag className={`w-4 h-4 ${priorities.find(p => p.id === ticket.prioridad)?.color}`} />
                                    {ticket.prioridad}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {priorityOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setPriorityOpen(false)}></div>
                                    <div className="absolute z-40 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1.5 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                                        {priorities.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleUpdate('prioridad', p.id)}
                                                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                            >
                                                <Flag className={`w-4 h-4 ${ticket.prioridad === p.id ? p.color : 'text-gray-300'}`} />
                                                <span className={ticket.prioridad === p.id ? 'text-gray-900 font-bold' : 'text-gray-700 capitalize'}>
                                                    {p.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className={`p-2 rounded-lg bg-white border border-gray-200 shadow-sm`}>
                                <Flag className={`w-4 h-4 ${priorities.find(p => p.id === ticket.prioridad)?.color}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Prioridad del caso</span>
                                <span className="text-sm font-bold text-gray-900 capitalize">{ticket.prioridad}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* SLA SECTION */}
                {ticket.vencimiento_sla && (
                    <div className="p-5 border-b border-gray-50">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tiempo de Respuesta</span>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-1">
                            <SlaTimer
                                vencimientoSla={ticket.vencimiento_sla}
                                estado={ticket.estado}
                                actualizadoEn={ticket.actualizado_en}
                                fechaResolucion={ticket.fecha_resolucion}
                            />
                        </div>
                    </div>
                )}

                {/* RESTAURANT INFO SECTION (LIMPIA Y RESTAURADA) */}
                {ticket.restaurantes && (
                    <div className="p-5 bg-gray-50/30 rounded-b-2xl">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Información de Sucursal
                        </span>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursal</span>
                                <span className="text-[15px] font-bold text-slate-900">
                                    {ticket.restaurantes.sigla} - {ticket.restaurantes.nombre_restaurante}
                                </span>
                            </div>



                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dirección</span>
                                <span className="text-[15px] font-bold text-slate-900">
                                    {ticket.restaurantes.direccion || 'No especificada'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}