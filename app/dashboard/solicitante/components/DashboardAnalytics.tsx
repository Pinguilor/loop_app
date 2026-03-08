'use client';

import { useState } from 'react';
import { Ticket } from '@/types/database.types';
import { LayoutDashboard, CheckCircle2, Clock, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
    tickets: Ticket[];
}

export function DashboardKPIs({ tickets }: Props) {
    const [activeModal, setActiveModal] = useState<'total' | 'activos' | 'resueltos' | null>(null);

    const totalTickets = tickets;
    const resolvedTickets = tickets.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado');
    const openTickets = tickets.filter(t => t.estado !== 'resuelto' && t.estado !== 'cerrado');

    const getModalData = () => {
        if (activeModal === 'total') return { title: 'Total Solicitudes', data: totalTickets };
        if (activeModal === 'activos') return { title: 'Tickets Activos', data: openTickets };
        if (activeModal === 'resueltos') return { title: 'Tickets Resueltos', data: resolvedTickets };
        return { title: '', data: [] };
    };

    const modalData = getModalData();

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setActiveModal('total')}
                    className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-4 hover:border-indigo-300 hover:shadow-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Solicitudes</p>
                        <h4 className="text-2xl font-bold text-gray-900">{totalTickets.length}</h4>
                    </div>
                </button>

                <button
                    onClick={() => setActiveModal('activos')}
                    className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-4 hover:border-amber-300 hover:shadow-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Tickets Activos</p>
                        <h4 className="text-2xl font-bold text-gray-900">{openTickets.length}</h4>
                    </div>
                </button>

                <button
                    onClick={() => setActiveModal('resueltos')}
                    className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-4 hover:border-emerald-300 hover:shadow-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Resueltos</p>
                        <h4 className="text-2xl font-bold text-gray-900">{resolvedTickets.length}</h4>
                    </div>
                </button>
            </div>

            {/* KPI Data Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                                {activeModal === 'total' && <LayoutDashboard className="w-5 h-5 text-indigo-500" />}
                                {activeModal === 'activos' && <Clock className="w-5 h-5 text-amber-500" />}
                                {activeModal === 'resueltos' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {modalData.title}
                                <span className="ml-2 bg-white px-2.5 py-0.5 rounded-full text-sm font-bold border border-slate-200">
                                    {modalData.data.length}
                                </span>
                            </h3>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            {modalData.data.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    No hay tickets para mostrar en esta categoría.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {modalData.data.map(ticket => (
                                        <Link
                                            key={ticket.id}
                                            href={`/dashboard/ticket/${ticket.id}`}
                                            className="group block border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                    #{ticket.numero_ticket}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                                                {ticket.titulo}
                                            </h4>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
