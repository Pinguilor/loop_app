'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
    Building2, Users, BookOpen, ChevronRight, ArrowLeft,
    Pencil, Plus, Loader2, AlertTriangle, CheckCircle2, X,
    Hash, FileText, Globe, ToggleRight, ToggleLeft,
    UserPlus, Shield, Trash2, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { actualizarClienteAction, toggleActivoClienteAction } from '../actions';
import { crearUsuarioAction, actualizarUsuarioAction, eliminarUsuarioAction } from '../../usuarios/actions';
import { CatalogoServiciosClient } from '@/app/dashboard/admin/catalogo/CatalogoServiciosClient';

// ── Tipos ──────────────────────────────────────────────────────
interface Cliente {
    id: string;
    nombre_fantasia: string;
    razon_social: string | null;
    rut: string | null;
    logo_url: string | null;
    activo: boolean;
    creado_en: string;
}

interface UsuarioCliente {
    id: string;
    full_name: string | null;
    email: string | null;
    rol: string | null;
    cliente_id: string;
    empresa: string;
    created_at: string | null;
}

interface TipoServicio {
    id: string;
    nombre: string;
    activo: boolean;
}

type Tab = 'info' | 'usuarios' | 'catalogo';

// ── Helpers ────────────────────────────────────────────────────
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={onClose} />
            {children}
        </div>
    );
}

function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Tab: Información General ──────────────────────────────────
function TabInfo({ cliente }: { cliente: Cliente }) {
    const router                          = useRouter();
    const [editando, setEditando]         = useState(false);
    const [isPending, startTransition]    = useTransition();
    const [togglingActive, startToggle]   = useTransition();
    const [error, setError]               = useState('');

    const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const fd = new FormData(e.currentTarget);
        fd.set('id', cliente.id);
        startTransition(async () => {
            const res = await actualizarClienteAction(fd);
            if (res.error) setError(res.error);
            else { setEditando(false); router.refresh(); }
        });
    };

    const handleToggle = () => {
        startToggle(async () => {
            await toggleActivoClienteAction(cliente.id, cliente.activo);
            router.refresh();
        });
    };

    const Field = ({ label, value }: { label: string; value: string | null }) => (
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-300 font-normal">—</span>}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header tarjeta */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl text-white shrink-0">
                        {cliente.logo_url ? (
                            <img src={cliente.logo_url} alt={cliente.nombre_fantasia} className="w-full h-full object-contain rounded-2xl" />
                        ) : (
                            cliente.nombre_fantasia.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60 font-bold uppercase tracking-widest">Cliente</p>
                        <h2 className="text-xl font-black text-white truncate">{cliente.nombre_fantasia}</h2>
                        {cliente.razon_social && (
                            <p className="text-sm text-white/70 font-medium truncate">{cliente.razon_social}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                            cliente.activo ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {!editando ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Nombre Fantasia" value={cliente.nombre_fantasia} />
                                <Field label="RUT Empresa" value={cliente.rut} />
                                <Field label="Razón Social" value={cliente.razon_social} />
                                <Field label="Fecha de Registro" value={formatDate(cliente.creado_en)} />
                            </div>
                            {cliente.logo_url && <Field label="URL del Logo" value={cliente.logo_url} />}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditando(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                                >
                                    <Pencil className="w-4 h-4" /> Editar Información
                                </button>
                                <button
                                    onClick={handleToggle}
                                    disabled={!!togglingActive}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-black rounded-xl border transition-all ${
                                        cliente.activo
                                            ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                    } disabled:opacity-50`}
                                >
                                    {togglingActive ? <Loader2 className="w-4 h-4 animate-spin" /> : cliente.activo ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                    {cliente.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleEdit} className="space-y-4">
                            {[
                                { label: 'Nombre Fantasia *', name: 'nombre_fantasia', required: true, defaultValue: cliente.nombre_fantasia, icon: Building2 },
                                { label: 'Razón Social', name: 'razon_social', defaultValue: cliente.razon_social ?? '', icon: FileText },
                                { label: 'RUT Empresa', name: 'rut', defaultValue: cliente.rut ?? '', icon: Hash },
                                { label: 'URL Logo', name: 'logo_url', type: 'url', defaultValue: cliente.logo_url ?? '', icon: Globe },
                            ].map(f => (
                                <div key={f.name}>
                                    <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">
                                        <f.icon className="w-3 h-3 text-slate-400" />{f.label}
                                    </label>
                                    <input
                                        name={f.name}
                                        type={f.type ?? 'text'}
                                        required={f.required}
                                        defaultValue={f.defaultValue}
                                        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            ))}

                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-sm font-medium">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setEditando(false); setError(''); }} disabled={isPending}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-40">
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {isPending ? 'Guardando…' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Modal: Crear Usuario (simplificado para el hub) ────────────
function ModalCrearUsuarioHub({
    clienteId, onClose, onSuccess,
}: {
    clienteId: string; onClose: () => void; onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]           = useState('');
    const [showPass, setShowPass]     = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const fd = new FormData(e.currentTarget);
        fd.set('rol', 'usuario');          // Siempre rol usuario desde aquí
        fd.set('cliente_id', clienteId);   // Auto-asignado al cliente del hub
        startTransition(async () => {
            const res = await crearUsuarioAction(fd);
            if (res.error) setError(res.error);
            else { onSuccess(); onClose(); }
        });
    };

    return (
        <ModalBackdrop onClose={() => !isPending && onClose()}>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl"><UserPlus className="w-5 h-5 text-white" /></div>
                    <div>
                        <h3 className="text-base font-black text-white">Nuevo Usuario</h3>
                        <p className="text-xs text-white/70 font-medium">Rol: Usuario · Empresa auto-asignada</p>
                    </div>
                    <button onClick={onClose} disabled={isPending} title="Cerrar"
                        className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                        <input name="nombre" type="text" required autoFocus placeholder="Ej: Juan Pérez"
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Correo Electrónico *</label>
                        <input name="email" type="email" required placeholder="juan@empresa.cl"
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Contraseña *</label>
                        <div className="relative">
                            <input name="password" type={showPass ? 'text' : 'password'} required minLength={6}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                            <button type="button" onClick={() => setShowPass(v => !v)} title={showPass ? 'Ocultar' : 'Mostrar'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black">
                                {showPass ? 'Ocultar' : 'Ver'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 text-indigo-700 text-xs font-medium">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        El usuario tendrá acceso exclusivo al catálogo y tickets de este cliente.
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} disabled={isPending}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isPending}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-black rounded-xl hover:bg-violet-700 transition-all shadow-md active:scale-95 disabled:opacity-40">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            {isPending ? 'Creando…' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalBackdrop>
    );
}

// ── Tab: Usuarios del Cliente ──────────────────────────────────
function TabUsuarios({
    usuarios: initialUsuarios, clienteId
}: {
    usuarios: UsuarioCliente[]; clienteId: string;
}) {
    const router                             = useRouter();
    const [modalCrear, setModalCrear]        = useState(false);
    const [togglingDelete, startDelete]      = useTransition();
    const [deletingId, setDeletingId]        = useState<string | null>(null);
    const [search, setSearch]                = useState('');

    const handleRefresh = useCallback(() => router.refresh(), [router]);

    const filtrados = initialUsuarios.filter(u =>
        search === '' ||
        (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (userId: string) => {
        if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
        setDeletingId(userId);
        startDelete(async () => {
            await eliminarUsuarioAction(userId);
            setDeletingId(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email…"
                        className="w-full border-2 border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bg-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh} title="Actualizar"
                        className="p-2.5 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white shadow-sm">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setModalCrear(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-black rounded-xl hover:bg-violet-700 transition-all shadow-md active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" /> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Email</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Creado</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-slate-400">
                                        <Users className="w-7 h-7 mx-auto mb-2 text-slate-200" />
                                        <p className="text-sm font-medium">
                                            {search ? 'No hay resultados.' : 'Este cliente aún no tiene usuarios.'}
                                        </p>
                                        {!search && (
                                            <button onClick={() => setModalCrear(true)}
                                                className="mt-3 text-xs font-black text-violet-600 hover:text-violet-800 transition-colors">
                                                + Crear el primer usuario
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : filtrados.map(u => {
                                const initials = (u.full_name ?? u.email ?? '?').charAt(0).toUpperCase();
                                const isDeleting = deletingId === u.id;
                                return (
                                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm shrink-0">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{u.full_name || '—'}</p>
                                                    <p className="text-xs text-slate-400 font-medium md:hidden truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 hidden md:table-cell">
                                            <span className="text-sm font-medium text-slate-600">{u.email || '—'}</span>
                                        </td>
                                        <td className="px-6 py-3.5 hidden lg:table-cell">
                                            <span className="text-xs font-medium text-slate-500">{formatDate(u.created_at)}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                disabled={isDeleting || !!togglingDelete}
                                                title="Eliminar usuario"
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                                            >
                                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtrados.length > 0 && (
                    <div className="px-6 py-2.5 border-t border-slate-100 bg-slate-50/50">
                        <span className="text-xs font-medium text-slate-400">
                            {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''} de este cliente
                        </span>
                    </div>
                )}
            </div>

            {modalCrear && (
                <ModalCrearUsuarioHub
                    clienteId={clienteId}
                    onClose={() => setModalCrear(false)}
                    onSuccess={handleRefresh}
                />
            )}
        </div>
    );
}

// ── Tab: Catálogo (wrapper para inyectar clienteId) ────────────
function TabCatalogo({ tiposServicio, clienteId }: { tiposServicio: TipoServicio[]; clienteId: string }) {
    return (
        <CatalogoServiciosClient
            tiposServicio={tiposServicio}
            isAdmin={true}
            clienteId={clienteId}
        />
    );
}

// ── Componente Principal: Client Hub ──────────────────────────
export function ClientHubClient({
    cliente,
    usuariosCliente,
    tiposServicio,
}: {
    cliente: Cliente;
    usuariosCliente: UsuarioCliente[];
    tiposServicio: TipoServicio[];
}) {
    const [tab, setTab] = useState<Tab>('info');

    const TABS: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { key: 'info',     label: 'Información General', icon: Building2 },
        { key: 'usuarios', label: 'Usuarios',             icon: Users,    count: usuariosCliente.length },
        { key: 'catalogo', label: 'Catálogo de Servicios', icon: BookOpen, count: tiposServicio.length },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
                <Link href="/dashboard/configuracion" className="text-slate-400 hover:text-slate-600 transition-colors font-medium">Configuración</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <Link href="/dashboard/configuracion/clientes" className="text-slate-400 hover:text-slate-600 transition-colors font-medium">Clientes</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-black text-slate-700">{cliente.nombre_fantasia}</span>
            </nav>

            {/* Header del Hub */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/configuracion/clientes"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    title="Volver a la lista"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    {cliente.logo_url ? (
                        <img src={cliente.logo_url} alt={cliente.nombre_fantasia}
                            className="w-12 h-12 rounded-2xl object-contain border border-slate-200 bg-white shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-lg text-white shrink-0 shadow-md">
                            {cliente.nombre_fantasia.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
                                {cliente.nombre_fantasia}
                            </h1>
                            <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                                cliente.activo ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                {cliente.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 truncate">
                            {cliente.razon_social || cliente.rut || 'Sin información adicional'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-1 overflow-x-auto">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                                    isActive
                                        ? 'border-violet-600 text-violet-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                                {t.label}
                                {t.count !== undefined && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                        isActive ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenido del Tab activo */}
            <div className="animate-in fade-in duration-200">
                {tab === 'info'     && <TabInfo     cliente={cliente} />}
                {tab === 'usuarios' && <TabUsuarios  usuarios={usuariosCliente} clienteId={cliente.id} />}
                {tab === 'catalogo' && <TabCatalogo  tiposServicio={tiposServicio} clienteId={cliente.id} />}
            </div>
        </div>
    );
}
