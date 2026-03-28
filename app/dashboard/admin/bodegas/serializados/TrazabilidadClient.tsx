'use client';

import React, { useState, useMemo } from 'react';
import {
    ScanLine, Search, ChevronDown, MapPin, Hash,
    CalendarDays, TicketIcon, User, Package, X,
} from 'lucide-react';
import Link from 'next/link';
import { SerializadoInstalado } from './page';

interface Props {
    serializados: SerializadoInstalado[];
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

export function TrazabilidadClient({ serializados }: Props) {
    const [search, setSearch] = useState('');
    const [openRestaurantes, setOpenRestaurantes] = useState<Set<string>>(new Set());

    const toggleRestaurante = (id: string) => {
        setOpenRestaurantes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // ── Filtro por búsqueda de SN, modelo o restaurante ──────────────────────
    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return serializados;
        return serializados.filter(s =>
            s.numero_serie.toLowerCase().includes(q) ||
            s.modelo.toLowerCase().includes(q) ||
            s.restaurante_nombre.toLowerCase().includes(q) ||
            s.restaurante_sigla.toLowerCase().includes(q)
        );
    }, [serializados, search]);

    // ── Agrupar por restaurante ───────────────────────────────────────────────
    const grupos = useMemo(() => {
        const map = new Map<string, { nombre: string; sigla: string; items: SerializadoInstalado[] }>();
        filtrados.forEach(s => {
            if (!map.has(s.restaurante_id)) {
                map.set(s.restaurante_id, {
                    nombre: s.restaurante_nombre,
                    sigla: s.restaurante_sigla,
                    items: [],
                });
            }
            map.get(s.restaurante_id)!.items.push(s);
        });
        // Ordenar por nombre de restaurante
        return Array.from(map.entries()).sort((a, b) =>
            a[1].nombre.localeCompare(b[1].nombre, 'es')
        );
    }, [filtrados]);

    // Abrir automáticamente todos cuando hay búsqueda activa
    const gruposConEstado = useMemo(() => {
        const hayBusqueda = search.trim().length > 0;
        return grupos.map(([id, data]) => ({
            id,
            ...data,
            isOpen: hayBusqueda || openRestaurantes.has(id),
        }));
    }, [grupos, search, openRestaurantes]);

    const totalEquipos = serializados.length;
    const totalRestaurantes = new Set(serializados.map(s => s.restaurante_id)).size;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Inventario</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                            <ScanLine className="w-6 h-6" />
                        </div>
                        Trazabilidad de Activos
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Rastrea dónde está instalado cada equipo serializado
                    </p>
                </div>

                {/* KPIs rápidos */}
                <div className="flex gap-3 shrink-0">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center shadow-sm">
                        <p className="text-2xl font-black text-slate-900 tabular-nums">{totalEquipos}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipos</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center shadow-sm">
                        <p className="text-2xl font-black text-slate-900 tabular-nums">{totalRestaurantes}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locales</p>
                    </div>
                </div>
            </div>

            {/* ── Buscador ── */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Buscar por N° de serie, modelo o local…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white shadow-sm placeholder:text-slate-400 transition-all"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ── Estado vacío ── */}
            {gruposConEstado.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ScanLine className="w-7 h-7 text-slate-300" />
                    </div>
                    <h3 className="text-base font-black text-slate-600 mb-1">
                        {search ? 'Sin resultados' : 'Sin activos instalados'}
                    </h3>
                    <p className="text-sm font-medium text-slate-400">
                        {search
                            ? `No hay equipos que coincidan con "${search}".`
                            : 'Cuando un técnico cierre un ticket con equipos, aparecerán aquí.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {gruposConEstado.map(grupo => (
                        <div
                            key={grupo.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            {/* ── Cabecera del acordeón ── */}
                            <button
                                type="button"
                                onClick={() => toggleRestaurante(grupo.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                                        {grupo.sigla?.slice(0, 2).toUpperCase() || <MapPin className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate">{grupo.nombre}</p>
                                        <p className="text-xs font-medium text-slate-400">{grupo.sigla}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                    <span className="bg-slate-100 text-slate-700 text-[11px] font-black px-2.5 py-1 rounded-full tabular-nums">
                                        {grupo.items.length} equipo{grupo.items.length !== 1 ? 's' : ''}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${grupo.isOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {/* ── Tabla interna con CSS grid-rows ── */}
                            <div className={`grid transition-all duration-300 ease-in-out ${grupo.isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                <div className="overflow-hidden">
                                    {/* Header de tabla */}
                                    <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-5 py-2 bg-slate-50 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1.5"><Package className="w-3 h-3" />Equipo</span>
                                        <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" />N° de Serie</span>
                                        <span className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" />Instalado</span>
                                        <span className="flex items-center gap-1.5"><TicketIcon className="w-3 h-3" />Ticket</span>
                                        <span className="flex items-center gap-1.5"><User className="w-3 h-3" />Técnico</span>
                                    </div>

                                    {/* Filas */}
                                    <div className="divide-y divide-slate-50">
                                        {grupo.items.map(item => (
                                            <div
                                                key={`${item.inventario_id}-${item.ticket_id}`}
                                                className="px-5 py-3.5 flex flex-col sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] sm:items-center gap-1.5 sm:gap-4 hover:bg-slate-50/50 transition-colors"
                                            >
                                                {/* Equipo */}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{item.modelo}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.familia}</span>
                                                </div>

                                                {/* N° Serie */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold">
                                                        {item.numero_serie}
                                                    </span>
                                                </div>

                                                {/* Fecha */}
                                                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                                                    {formatDate(item.fecha_instalacion)}
                                                </span>

                                                {/* Ticket */}
                                                <div>
                                                    {item.ticket_id ? (
                                                        <Link
                                                            href={`/dashboard/ticket/${item.ticket_id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                                        >
                                                            <TicketIcon className="w-3 h-3" />
                                                            NC-{item.ticket_numero}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </div>

                                                {/* Técnico */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-[9px] shrink-0">
                                                        {item.tecnico_nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 truncate">{item.tecnico_nombre}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer con conteo de resultados filtrados */}
            {search && gruposConEstado.length > 0 && (
                <p className="text-center text-xs font-medium text-slate-400">
                    {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} para &ldquo;{search}&rdquo;
                </p>
            )}
        </div>
    );
}
