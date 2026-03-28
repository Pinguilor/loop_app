'use client';

import React, { useState, useTransition } from 'react';
import {
    CheckCircle2, XCircle, Clock, PackageCheck, Hash, Layers,
    Loader2, AlertCircle, ChevronRight, Warehouse, User,
    TicketIcon, AlertTriangle
} from 'lucide-react';
import { aprobarSolicitudAction, rechazarSolicitudAction } from './actions';
import { CustomSelect } from '@/app/dashboard/components/CustomSelect';
import { useRouter } from 'next/navigation';

// ── Tipos ────────────────────────────────────────────────────
interface Bodega { id: string; nombre: string; tipo: string; }
interface InvItem { id: string; modelo: string | null; familia: string | null; es_serializado: boolean; numero_serie: string | null; cantidad: number; }
interface SolicitudItem { id: string; cantidad: number; inventario: InvItem | null; }
interface Solicitud {
    id: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    creado_en: string;
    gestionado_en: string | null;
    motivo_rechazo: string | null;
    tecnico: { id: string; full_name: string | null } | null;
    bodeguero: { full_name: string | null } | null;
    ticket: { id: string; numero_ticket: number; titulo: string } | null;
    solicitud_items: SolicitudItem[];
}

interface Props {
    solicitudes: Solicitud[];
    bodegasCentrales: Bodega[];
}

// ── Helpers ──────────────────────────────────────────────────
function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} días`;
}

const ESTADO_CONFIG = {
    pendiente: { label: 'Pendiente', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', text: 'text-amber-700', badgeBg: 'bg-amber-100' },
    aprobada:  { label: 'Aprobada',  bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', badgeBg: 'bg-emerald-100' },
    rechazada: { label: 'Rechazada', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400', text: 'text-red-700', badgeBg: 'bg-red-100' },
};

// ── Modal de Aprobación (con Aprobación Parcial) ─────────────
function ModalAprobar({
    solicitud,
    bodegasCentrales,
    onClose,
    onSuccess,
}: {
    solicitud: Solicitud;
    bodegasCentrales: Bodega[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [bodegaId, setBodegaId] = useState(bodegasCentrales[0]?.id || '');
    // Todos los ítems marcados por defecto
    const [itemsAprobados, setItemsAprobados] = useState<Set<string>>(
        () => new Set(solicitud.solicitud_items.map(i => i.id))
    );
    const [comentario, setComentario] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const toggleItem = (id: string) => {
        setItemsAprobados(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const aprobadosCount = itemsAprobados.size;
    const totalCount = solicitud.solicitud_items.length;
    const esAprobacionParcial = aprobadosCount > 0 && aprobadosCount < totalCount;

    const handleConfirm = () => {
        if (!bodegaId) { setError('Debes seleccionar una bodega central.'); return; }
        if (aprobadosCount === 0) { setError('Debes aprobar al menos un ítem.'); return; }
        setError('');
        startTransition(async () => {
            const res = await aprobarSolicitudAction(
                solicitud.id,
                bodegaId,
                Array.from(itemsAprobados),
                comentario.trim() || null,
            );
            if (res.error) { setError(res.error); }
            else { onSuccess(); onClose(); }
        });
    };

    const totalUnidadesAprobadas = solicitud.solicitud_items
        .filter(i => itemsAprobados.has(i.id))
        .reduce((s, i) => s + i.cantidad, 0);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">
                {/* Header */}
                <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-800">Confirmar Aprobación</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {solicitud.tecnico?.full_name || 'Técnico'} · Ticket NC-{solicitud.ticket?.numero_ticket}
                            {esAprobacionParcial && (
                                <span className="ml-2 text-amber-600 font-black">· Parcial</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* Banner aprobación parcial */}
                    {esAprobacionParcial && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-xs font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Aprobación parcial: {aprobadosCount} de {totalCount} ítems serán despachados. Los ítems desmarcados quedarán pendientes.</span>
                        </div>
                    )}

                    {/* Lista de ítems con checkboxes */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Ítems a despachar
                            </span>
                            <span className="text-[10px] font-black text-slate-500">
                                {aprobadosCount}/{totalCount} · {totalUnidadesAprobadas} unidad{totalUnidadesAprobadas !== 1 ? 'es' : ''}
                            </span>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                            {solicitud.solicitud_items.map(item => {
                                const checked = itemsAprobados.has(item.id);
                                return (
                                    <label
                                        key={item.id}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-emerald-50/60' : 'bg-white opacity-60'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleItem(item.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 shrink-0"
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-bold text-slate-700 truncate">{item.inventario?.modelo ?? '—'}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{item.inventario?.familia ?? '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {item.inventario?.es_serializado && item.inventario.numero_serie && (
                                                <span className="font-mono text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">
                                                    #{item.inventario.numero_serie}
                                                </span>
                                            )}
                                            <span className="text-sm font-black text-slate-800">x{item.cantidad}</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selector Bodega Central */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Warehouse className="w-4 h-4 text-indigo-500" />
                            Descontar desde Bodega Central
                        </label>
                        {bodegasCentrales.length === 0 ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                No hay bodegas centrales configuradas.
                            </div>
                        ) : bodegasCentrales.length === 1 ? (
                            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-800 flex items-center gap-2">
                                <Warehouse className="w-4 h-4 text-indigo-500 shrink-0" />
                                {bodegasCentrales[0].nombre}
                            </div>
                        ) : (
                            <CustomSelect
                                id="bodega-central"
                                value={bodegaId}
                                onChange={setBodegaId}
                                placeholder="Seleccionar bodega central…"
                                options={bodegasCentrales.map(b => ({ value: b.id, label: b.nombre }))}
                            />
                        )}
                    </div>

                    {/* Comentario opcional */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                            Comentario de Entrega <span className="text-slate-400 font-medium normal-case tracking-normal">(opcional)</span>
                        </label>
                        <textarea
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
                            placeholder="Ej: Se entrega displayport alternativo de 1.4 compatible…"
                            rows={3}
                            className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending || !bodegaId || aprobadosCount === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:shadow-none"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isPending ? 'Procesando…' : esAprobacionParcial ? `Aprobar ${aprobadosCount} ítem${aprobadosCount !== 1 ? 's' : ''}` : 'Aprobar Todo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal de Rechazo ─────────────────────────────────────────
function ModalRechazar({
    solicitud,
    onClose,
    onSuccess,
}: {
    solicitud: Solicitud;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        if (!motivo.trim()) { setError('El motivo es obligatorio.'); return; }
        setError('');
        startTransition(async () => {
            const res = await rechazarSolicitudAction(solicitud.id, motivo);
            if (res.error) { setError(res.error); }
            else { onSuccess(); onClose(); }
        });
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                        <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-800">Rechazar Solicitud</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            De {solicitud.tecnico?.full_name || 'Técnico'} · Ticket NC-{solicitud.ticket?.numero_ticket}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                            Motivo del Rechazo *
                        </label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="Explica al técnico por qué no se puede aprobar (ej: Sin stock, ítem incorrecto…)"
                            rows={4}
                            className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending || !motivo.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-black rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:shadow-none"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        {isPending ? 'Rechazando…' : 'Rechazar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Tarjeta de Solicitud ─────────────────────────────────────
function SolicitudCard({
    solicitud,
    bodegasCentrales,
    onRefresh,
}: {
    solicitud: Solicitud;
    bodegasCentrales: Bodega[];
    onRefresh: () => void;
}) {
    const [modalAprobar, setModalAprobar] = useState(false);
    const [modalRechazar, setModalRechazar] = useState(false);
    const cfg = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.pendiente;
    const isPending = solicitud.estado === 'pendiente';
    const totalUnidades = solicitud.solicitud_items.reduce((s, i) => s + i.cantidad, 0);

    return (
        <>
            <div className={`bg-white rounded-2xl border ${cfg.border} shadow-sm overflow-hidden transition-all hover:shadow-md`}>
                {/* Card Header */}
                <div className={`px-5 py-3.5 ${cfg.bg} border-b ${cfg.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${cfg.text}`}>
                            {cfg.label}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(solicitud.creado_en)}
                        </span>
                    </div>
                    <a
                        href={`/dashboard/ticket/${solicitud.ticket?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                    >
                        <TicketIcon className="w-3.5 h-3.5" />
                        NC-{solicitud.ticket?.numero_ticket}
                        <ChevronRight className="w-3 h-3" />
                    </a>
                </div>

                {/* Card Body */}
                <div className="p-5">
                    {/* Info del técnico y ticket */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200">
                                {solicitud.tecnico?.full_name?.charAt(0).toUpperCase() ?? <User className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-black text-slate-800 truncate">
                                    {solicitud.tecnico?.full_name ?? 'Técnico desconocido'}
                                </p>
                                <p className="text-xs text-slate-500 font-medium truncate">
                                    {solicitud.ticket?.titulo ?? '—'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                {solicitud.solicitud_items.length} línea{solicitud.solicitud_items.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                {totalUnidades} unid.
                            </span>
                        </div>
                    </div>

                    {/* Lista de ítems */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden mb-4">
                        {solicitud.solicitud_items.map(item => (
                            <div key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={`p-1 rounded-md shrink-0 ${item.inventario?.es_serializado ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {item.inventario?.es_serializado
                                            ? <Hash className="w-3 h-3" />
                                            : <Layers className="w-3 h-3" />
                                        }
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-sm font-bold text-slate-700 block truncate">
                                            {item.inventario?.modelo ?? '—'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {item.inventario?.familia ?? '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {item.inventario?.es_serializado && item.inventario.numero_serie && (
                                        <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hidden sm:block">
                                            #{item.inventario.numero_serie}
                                        </span>
                                    )}
                                    <span className="text-sm font-black text-slate-800 min-w-[30px] text-right">
                                        x{item.cantidad}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info de rechazo (si aplica) */}
                    {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
                        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span><span className="font-black">Motivo:</span> {solicitud.motivo_rechazo}</span>
                        </div>
                    )}

                    {/* Info de quien gestionó (si aplica) */}
                    {solicitud.estado !== 'pendiente' && solicitud.bodeguero?.full_name && (
                        <p className="text-[10px] text-slate-400 font-medium mb-4">
                            Gestionado por <span className="font-black text-slate-600">{solicitud.bodeguero.full_name}</span>
                            {solicitud.gestionado_en && <> · {timeAgo(solicitud.gestionado_en)}</>}
                        </p>
                    )}

                    {/* Acciones (solo si pendiente) */}
                    {isPending && (
                        <div className="flex gap-2.5 pt-1">
                            <button
                                onClick={() => setModalRechazar(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all active:scale-95"
                            >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                            </button>
                            <button
                                onClick={() => setModalAprobar(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Aprobar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {modalAprobar && (
                <ModalAprobar
                    solicitud={solicitud}
                    bodegasCentrales={bodegasCentrales}
                    onClose={() => setModalAprobar(false)}
                    onSuccess={onRefresh}
                />
            )}
            {modalRechazar && (
                <ModalRechazar
                    solicitud={solicitud}
                    onClose={() => setModalRechazar(false)}
                    onSuccess={onRefresh}
                />
            )}
        </>
    );
}

// ── Componente Principal ──────────────────────────────────────
export function GestionSolicitudesClient({ solicitudes: initialSolicitudes, bodegasCentrales }: Props) {
    const router = useRouter();
    const [filtro, setFiltro] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('pendiente');

    const solicitudesFiltradas = initialSolicitudes.filter(s =>
        filtro === 'todas' ? true : s.estado === filtro
    );

    const counts = {
        todas: initialSolicitudes.length,
        pendiente: initialSolicitudes.filter(s => s.estado === 'pendiente').length,
        aprobada: initialSolicitudes.filter(s => s.estado === 'aprobada').length,
        rechazada: initialSolicitudes.filter(s => s.estado === 'rechazada').length,
    };

    const handleRefresh = () => router.refresh();

    const filtros: { key: typeof filtro; label: string; count: number; color: string }[] = [
        { key: 'pendiente', label: 'Pendientes', count: counts.pendiente, color: 'amber' },
        { key: 'aprobada',  label: 'Aprobadas',  count: counts.aprobada,  color: 'emerald' },
        { key: 'rechazada', label: 'Rechazadas', count: counts.rechazada, color: 'red' },
        { key: 'todas',     label: 'Todas',      count: counts.todas,     color: 'slate' },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                            <PackageCheck className="w-6 h-6" />
                        </div>
                        Solicitudes de Materiales
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Gestiona las solicitudes de materiales enviadas por los técnicos
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white shadow-sm"
                >
                    <Loader2 className="w-3.5 h-3.5" />
                    Actualizar
                </button>
            </div>

            {/* Filtros / Tabs */}
            <div className="flex flex-wrap gap-2">
                {filtros.map(f => {
                    const isActive = filtro === f.key;
                    const colorMap: Record<string, string> = {
                        amber:   isActive ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
                        emerald: isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
                        red:     isActive ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-red-600 border-red-200 hover:bg-red-50',
                        slate:   isActive ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                    };
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFiltro(f.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black transition-all ${colorMap[f.color]}`}
                        >
                            {f.label}
                            <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                {f.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Grid de Solicitudes */}
            {solicitudesFiltradas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PackageCheck className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-700 mb-1">
                        {filtro === 'pendiente' ? 'No hay solicitudes pendientes' : `No hay solicitudes ${filtro === 'todas' ? '' : filtro + 's'}`}
                    </h3>
                    <p className="text-sm font-medium text-slate-400">
                        {filtro === 'pendiente'
                            ? 'Cuando un técnico solicite materiales, aparecerán aquí.'
                            : 'Prueba cambiando el filtro superior.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {solicitudesFiltradas.map(sol => (
                        <SolicitudCard
                            key={sol.id}
                            solicitud={sol}
                            bodegasCentrales={bodegasCentrales}
                            onRefresh={handleRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
