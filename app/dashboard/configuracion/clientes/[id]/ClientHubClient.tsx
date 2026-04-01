'use client';

import React, { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import {
    Building2, Users, BookOpen, ChevronRight, ChevronLeft, ArrowLeft,
    Pencil, Plus, Loader2, AlertTriangle, CheckCircle2, X,
    Hash, FileText, Globe, ToggleRight, ToggleLeft,
    UserPlus, Shield, Trash2, RefreshCw, MapPin, Mail, Wifi, Search,
    KeyRound, Copy, Check,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { actualizarClienteAction, toggleActivoClienteAction } from '../actions';
import { crearUsuarioAction, actualizarUsuarioAction, eliminarUsuarioAction, blanquearPasswordAction } from '../../usuarios/actions';
import { crearRestauranteAction, actualizarRestauranteAction, eliminarRestauranteAction } from './restaurantesActions';
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

interface Restaurante {
    id: string;
    nombre_restaurante: string;
    sigla: string;
    ip: string | null;
    correo: string | null;
    direccion: string | null;
}

type Tab = 'info' | 'usuarios' | 'catalogo' | 'restaurantes';

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
                                { label: 'Área / Nombre de Fantasía *', name: 'nombre_fantasia', required: true, defaultValue: cliente.nombre_fantasia, icon: Building2 },
                                { label: 'Razón Social *', name: 'razon_social', required: true, defaultValue: cliente.razon_social ?? '', icon: FileText },
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
    const [error, setError]            = useState('');
    const [successMsg, setSuccessMsg]  = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const fd = new FormData(e.currentTarget);
        fd.set('rol', 'usuario');
        fd.set('cliente_id', clienteId);
        startTransition(async () => {
            const res = await crearUsuarioAction(fd);
            if (res.error) setError(res.error);
            else { onSuccess(); setSuccessMsg(res.defaultPassword ?? 'SystelPassword'); }
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

                {successMsg ? (
                    <div className="p-6 space-y-5">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-base font-black text-slate-900">¡Usuario creado exitosamente!</p>
                                <p className="text-sm text-slate-500 mt-1">Se ha asignado la contraseña por defecto.</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
                            <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Contraseña por defecto</p>
                                <p className="text-lg font-black text-amber-900 font-mono tracking-wide">{successMsg}</p>
                                <p className="text-xs text-amber-700 mt-1.5">El usuario deberá cambiarla en su primer inicio de sesión.</p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md">
                            Entendido, cerrar
                        </button>
                    </div>
                ) : (
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

                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-amber-700 text-xs font-medium">
                            <KeyRound className="w-3.5 h-3.5 shrink-0" />
                            Se asignará la contraseña por defecto: <span className="font-black ml-1">SystelPassword</span>
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
                )}
            </div>
        </ModalBackdrop>
    );
}

// ── Modal: Blanquear Contraseña (hub clientes) ─────────────────
function ModalBlanquearHub({ usuario, onClose }: { usuario: UsuarioCliente; onClose: () => void }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]            = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [copied, setCopied]          = useState(false);

    const handleBlanquear = () => {
        setError('');
        startTransition(async () => {
            const res = await blanquearPasswordAction(usuario.id);
            if (res.error) { setError(res.error); return; }
            setTempPassword(res.tempPassword ?? '');
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(tempPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <ModalBackdrop onClose={() => !isPending && onClose()}>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10">
                <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl"><KeyRound className="w-5 h-5 text-white" /></div>
                    <div>
                        <h3 className="text-base font-black text-white">Blanquear Contraseña</h3>
                        <p className="text-xs text-amber-100 font-medium truncate max-w-[220px]">{usuario.email}</p>
                    </div>
                    <button onClick={onClose} disabled={isPending} title="Cerrar"
                        className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {tempPassword ? (
                        <>
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                </div>
                                <p className="text-base font-black text-slate-900">Contraseña restablecida</p>
                                <p className="text-sm text-slate-500">
                                    Entrega esta clave temporal a{' '}
                                    <span className="font-bold text-slate-700">{usuario.full_name || 'el usuario'}</span>.
                                    Deberá cambiarla en su próximo ingreso.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-4 py-3">
                                <span className="flex-1 font-mono text-lg font-black text-white tracking-widest select-all">
                                    {tempPassword}
                                </span>
                                <button type="button" onClick={handleCopy} title="Copiar al portapapeles"
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0">
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            {copied && (
                                <p className="text-center text-xs text-emerald-600 font-bold animate-in fade-in duration-200">
                                    ¡Copiado al portapapeles!
                                </p>
                            )}
                            <button onClick={onClose}
                                className="w-full px-4 py-2.5 bg-slate-800 text-white text-sm font-black rounded-xl hover:bg-slate-700 transition-all shadow-md">
                                Listo, cerrar
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-sm font-medium text-amber-900">
                                    Se generará una contraseña temporal aleatoria para{' '}
                                    <span className="font-black">{usuario.full_name || 'este usuario'}</span>.
                                    El usuario deberá cambiarla en su próximo inicio de sesión.
                                </p>
                            </div>
                            {error && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-sm font-medium">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} disabled={isPending}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button onClick={handleBlanquear} disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-black rounded-xl hover:bg-amber-600 transition-all shadow-md active:scale-95 disabled:opacity-40">
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                    {isPending ? 'Generando…' : 'Generar contraseña'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ModalBackdrop>
    );
}

// ── Modal: Eliminar Usuario (hub clientes) ─────────────────────
function ModalEliminarUsuarioHub({ usuario, onClose, onSuccess }: {
    usuario: UsuarioCliente; onClose: () => void; onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]            = useState('');
    const [confirm, setConfirm]        = useState('');
    const CONFIRM_WORD = 'ELIMINAR';
    const canDelete = confirm === CONFIRM_WORD;

    const handleDelete = () => {
        setError('');
        startTransition(async () => {
            const res = await eliminarUsuarioAction(usuario.id);
            if (res.error) setError(res.error);
            else { onSuccess(); onClose(); }
        });
    };

    return (
        <ModalBackdrop onClose={() => !isPending && onClose()}>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10 border-2 border-red-100">
                <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl"><Trash2 className="w-5 h-5 text-white" /></div>
                    <div>
                        <h3 className="text-base font-black text-white">Eliminar Usuario</h3>
                        <p className="text-xs text-red-200 font-medium">Esta acción es irreversible</p>
                    </div>
                    <button onClick={onClose} disabled={isPending} title="Cerrar"
                        className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-red-800">
                            Vas a eliminar la cuenta de{' '}
                            <span className="font-black">{usuario.full_name || 'este usuario'}</span>{' '}
                            ({usuario.email}). Se borrará su acceso permanentemente.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">
                            Escribe <span className="text-red-600">{CONFIRM_WORD}</span> para confirmar
                        </label>
                        <input
                            type="text" value={confirm}
                            onChange={e => setConfirm(e.target.value.toUpperCase())}
                            placeholder={CONFIRM_WORD}
                            className="w-full border-2 border-red-200 rounded-xl px-3 py-2.5 text-sm font-black text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all tracking-widest"
                        />
                    </div>
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                        </div>
                    )}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={isPending}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                        <button onClick={handleDelete} disabled={isPending || !canDelete}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-black rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {isPending ? 'Eliminando…' : 'Eliminar'}
                        </button>
                    </div>
                </div>
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
    const router                                  = useRouter();
    const [modalCrear, setModalCrear]             = useState(false);
    const [modalBlanquear, setModalBlanquear]     = useState<UsuarioCliente | null>(null);
    const [modalEliminar, setModalEliminar]       = useState<UsuarioCliente | null>(null);
    const [search, setSearch]                     = useState('');

    const handleRefresh = useCallback(() => router.refresh(), [router]);

    const filtrados = initialUsuarios.filter(u =>
        search === '' ||
        (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    );

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
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setModalBlanquear(u)}
                                                    title="Blanquear contraseña"
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setModalEliminar(u)}
                                                    title="Eliminar usuario"
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
            {modalBlanquear && (
                <ModalBlanquearHub
                    usuario={modalBlanquear}
                    onClose={() => setModalBlanquear(null)}
                />
            )}
            {modalEliminar && (
                <ModalEliminarUsuarioHub
                    usuario={modalEliminar}
                    onClose={() => setModalEliminar(null)}
                    onSuccess={handleRefresh}
                />
            )}
        </div>
    );
}

// ── Modal: Crear / Editar Restaurante ─────────────────────────
function ModalRestaurante({
    restaurante, clienteId, onClose, onSuccess,
}: {
    restaurante: Restaurante | null;
    clienteId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]  = useState('');
    const [sigla, setSigla]  = useState(restaurante?.sigla ?? '');
    const [correo, setCorreo] = useState(restaurante?.correo ?? '');
    const esEdicion = !!restaurante;

    const handleSiglaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSigla(val);
        // Autocompletar correo con el formato estándar MCD
        setCorreo(`lcl.${val.toLowerCase()}@cl.mcd.com`);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const fd = new FormData(e.currentTarget);
        fd.set('sigla', sigla);
        fd.set('correo', correo);
        if (restaurante) fd.set('id', restaurante.id);

        startTransition(async () => {
            const action = esEdicion
                ? actualizarRestauranteAction(fd, clienteId)
                : crearRestauranteAction(fd, clienteId);
            const res = await action;
            if (res.error) setError(res.error);
            else { onSuccess(); onClose(); }
        });
    };

    const inputClass = "w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white";
    const labelClass = "flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5";

    return (
        <ModalBackdrop onClose={() => !isPending && onClose()}>
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">
                            {esEdicion ? 'Editar Restaurante' : 'Nuevo Restaurante'}
                        </h3>
                        <p className="text-xs text-white/70 font-medium">
                            {esEdicion ? `Modificar datos de ${restaurante.sigla}` : 'Registrar sucursal en este cliente'}
                        </p>
                    </div>
                    <button onClick={onClose} disabled={isPending} title="Cerrar"
                        className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className={labelClass}>
                            <MapPin className="w-3 h-3 text-slate-400" /> Nombre del Restaurante *
                        </label>
                        <input
                            name="nombre_restaurante"
                            type="text"
                            required
                            autoFocus
                            defaultValue={restaurante?.nombre_restaurante ?? ''}
                            placeholder="Ej: McDonald's Kennedy"
                            className={inputClass}
                        />
                    </div>

                    {/* Sigla + IP en grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                <Hash className="w-3 h-3 text-slate-400" /> Sigla *
                            </label>
                            <input
                                name="sigla"
                                type="text"
                                required
                                value={sigla}
                                onChange={handleSiglaChange}
                                placeholder="Ej: KNN"
                                className={`${inputClass} uppercase`}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                <Wifi className="w-3 h-3 text-slate-400" /> Dirección IP
                            </label>
                            <input
                                name="ip"
                                type="text"
                                defaultValue={restaurante?.ip ?? ''}
                                placeholder="Ej: 192.168.1.100"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Correo — se autocompleta desde sigla */}
                    <div>
                        <label className={labelClass}>
                            <Mail className="w-3 h-3 text-slate-400" /> Correo
                            <span className="ml-1 text-[10px] font-medium text-emerald-600 normal-case tracking-normal">
                                (se llena automáticamente con la sigla)
                            </span>
                        </label>
                        <input
                            name="correo"
                            type="email"
                            value={correo}
                            onChange={e => setCorreo(e.target.value)}
                            placeholder="lcl.knn@cl.mcd.com"
                            className={inputClass}
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className={labelClass}>
                            <FileText className="w-3 h-3 text-slate-400" /> Dirección
                        </label>
                        <input
                            name="direccion"
                            type="text"
                            defaultValue={restaurante?.direccion ?? ''}
                            placeholder="Ej: Av. Kennedy 5601, Vitacura"
                            className={inputClass}
                        />
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-40">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {isPending ? 'Guardando…' : esEdicion ? 'Guardar Cambios' : 'Crear Restaurante'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalBackdrop>
    );
}

// ── Tab: Restaurantes del Cliente ──────────────────────────────
function TabRestaurantes({
    restaurantes: initialRestaurantes, clienteId,
}: {
    restaurantes: Restaurante[]; clienteId: string;
}) {
    const ITEMS_PER_PAGE = 20;

    const router                                      = useRouter();
    const [modal, setModal]                           = useState<'crear' | Restaurante | null>(null);
    const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurante | null>(null);
    const [deletingId, setDeletingId]                 = useState<string | null>(null);
    const [deleteError, setDeleteError]               = useState('');
    const [search, setSearch]                         = useState('');
    const [currentPage, setCurrentPage]               = useState(1);
    const [, startDelete]                             = useTransition();
    const tableTopRef                                 = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tableTopRef.current) {
            tableTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentPage]);

    const handleRefresh = useCallback(() => router.refresh(), [router]);

    const filtrados = initialRestaurantes.filter(r =>
        search === '' ||
        r.nombre_restaurante.toLowerCase().includes(search.toLowerCase()) ||
        r.sigla.toLowerCase().includes(search.toLowerCase()) ||
        (r.direccion ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const totalPages        = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
    const indexOfFirst      = (currentPage - 1) * ITEMS_PER_PAGE;
    const indexOfLast       = indexOfFirst + ITEMS_PER_PAGE;
    const currentRestaurants = filtrados.slice(indexOfFirst, indexOfLast);

    const handleDeleteRequest = (r: Restaurante) => {
        setDeleteError('');
        setRestaurantToDelete(r);
    };

    const handleConfirmDelete = () => {
        if (!restaurantToDelete) return;
        const target = restaurantToDelete;
        setRestaurantToDelete(null);
        setDeletingId(target.id);
        setDeleteError('');
        startDelete(async () => {
            const res = await eliminarRestauranteAction(target.id, clienteId);
            setDeletingId(null);
            if (res.error) setDeleteError(res.error);
            else router.refresh();
        });
    };

    return (
        <div ref={tableTopRef} className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Buscar por nombre, sigla o dirección…"
                        className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh} title="Actualizar"
                        className="p-2.5 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white shadow-sm">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setModal('crear')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Restaurante
                    </button>
                </div>
            </div>

            {deleteError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />{deleteError}
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sigla</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">IP</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Correo</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">Dirección</th>
                                <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-400">
                                        <MapPin className="w-7 h-7 mx-auto mb-2 text-slate-200" />
                                        <p className="text-sm font-medium">
                                            {search ? 'No hay restaurantes que coincidan.' : 'Este cliente aún no tiene restaurantes.'}
                                        </p>
                                        {!search && (
                                            <button onClick={() => setModal('crear')}
                                                className="mt-3 text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors">
                                                + Registrar el primer restaurante
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : currentRestaurants.map(r => {
                                const isDeleting = deletingId === r.id;
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                                        {/* Nombre */}
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-bold text-slate-800">{r.nombre_restaurante}</p>
                                            {r.direccion && (
                                                <p className="text-xs text-slate-400 font-medium truncate max-w-[180px] xl:hidden">
                                                    {r.direccion}
                                                </p>
                                            )}
                                        </td>
                                        {/* Sigla */}
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {r.sigla}
                                            </span>
                                        </td>
                                        {/* IP */}
                                        <td className="px-5 py-3.5 hidden md:table-cell">
                                            {r.ip ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600">
                                                    <Wifi className="w-3 h-3 text-slate-400" />{r.ip}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-300">—</span>
                                            )}
                                        </td>
                                        {/* Correo */}
                                        <td className="px-5 py-3.5 hidden lg:table-cell">
                                            {r.correo ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 truncate max-w-[200px]">
                                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />{r.correo}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-300">—</span>
                                            )}
                                        </td>
                                        {/* Dirección */}
                                        <td className="px-5 py-3.5 hidden xl:table-cell">
                                            <span className="text-sm font-medium text-slate-500 truncate max-w-[220px] block">
                                                {r.direccion || '—'}
                                            </span>
                                        </td>
                                        {/* Acciones */}
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setModal(r)}
                                                    title="Editar restaurante"
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(r)}
                                                    disabled={isDeleting}
                                                    title="Eliminar restaurante"
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                                                >
                                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtrados.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-slate-400">
                            {indexOfFirst + 1}–{Math.min(indexOfLast, filtrados.length)} de {filtrados.length} restaurante{filtrados.length !== 1 ? 's' : ''}
                            {search && ` (${initialRestaurantes.length} en total)`}
                        </span>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
                                    title="Página anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-slate-600 px-1 min-w-[80px] text-center">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
                                    title="Página siguiente"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Crear / Editar */}
            {(modal === 'crear' || (modal && typeof modal === 'object')) && (
                <ModalRestaurante
                    restaurante={modal === 'crear' ? null : modal}
                    clienteId={clienteId}
                    onClose={() => setModal(null)}
                    onSuccess={handleRefresh}
                />
            )}

            {/* Modal Confirmar Eliminación */}
            {restaurantToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRestaurantToDelete(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Eliminar restaurante</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Esta acción no se puede deshacer.</p>
                            </div>
                        </div>

                        {/* Mensaje de confirmación */}
                        <p className="text-sm text-slate-700 mb-6">
                            ¿Estás seguro de que deseas eliminar el restaurante{' '}
                            <span className="font-black text-slate-900">
                                &quot;{restaurantToDelete.nombre_restaurante} ({restaurantToDelete.sigla})&quot;
                            </span>?
                            Esta acción eliminará el registro permanentemente y no se puede deshacer.
                        </p>

                        {/* Acciones */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRestaurantToDelete(null)}
                                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-sm font-black text-white bg-red-600 rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
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
    restaurantes,
}: {
    cliente: Cliente;
    usuariosCliente: UsuarioCliente[];
    tiposServicio: TipoServicio[];
    restaurantes: Restaurante[];
}) {
    const [tab, setTab] = useState<Tab>('info');

    const TABS: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { key: 'info',         label: 'Información General',  icon: Building2 },
        { key: 'usuarios',     label: 'Usuarios',              icon: Users,    count: usuariosCliente.length },
        { key: 'restaurantes', label: 'Restaurantes',          icon: MapPin,   count: restaurantes.length },
        { key: 'catalogo',     label: 'Catálogo de Servicios', icon: BookOpen, count: tiposServicio.length },
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
                {tab === 'info'         && <TabInfo         cliente={cliente} />}
                {tab === 'usuarios'     && <TabUsuarios      usuarios={usuariosCliente} clienteId={cliente.id} />}
                {tab === 'restaurantes' && <TabRestaurantes  restaurantes={restaurantes} clienteId={cliente.id} />}
                {tab === 'catalogo'     && <TabCatalogo      tiposServicio={tiposServicio} clienteId={cliente.id} />}
            </div>
        </div>
    );
}
