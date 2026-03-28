'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
    UserPlus, Pencil, Trash2, Loader2, AlertTriangle,
    CheckCircle2, X, Shield, Users, RefreshCw, Eye, EyeOff, Building2
} from 'lucide-react';
import {
    crearUsuarioAction,
    actualizarUsuarioAction,
    eliminarUsuarioAction,
} from './actions';
import { CustomSelect } from '@/app/dashboard/components/CustomSelect';
import { useRouter } from 'next/navigation';

// ── Tipos ──────────────────────────────────────────────────────
interface Usuario {
    id: string;
    full_name: string | null;
    email: string | null;
    rol: string | null;
    cliente_id: string | null;
    empresa: string | null;
    created_at: string | null;
}

interface ClienteOption {
    id: string;
    nombre_fantasia: string;
}

// ── Constantes de roles ────────────────────────────────────────
const ROLES = [
    { value: 'usuario',      label: 'Usuario',       color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'tecnico',      label: 'Técnico',        color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'coordinador',  label: 'Coordinador',    color: 'bg-violet-100 text-violet-700 border-violet-200' },
    { value: 'admin_bodega', label: 'Admin Bodega',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'admin',        label: 'Administrador',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

const ROLES_STAFF = ['tecnico', 'coordinador', 'admin_bodega', 'admin'];

function getRolConfig(rol: string | null) {
    return ROLES.find(r => r.value === rol?.toLowerCase())
        ?? { label: rol || '—', color: 'bg-slate-100 text-slate-500 border-slate-200' };
}

function timeAgo(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Backdrop modal ─────────────────────────────────────────────
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={onClose} />
            {children}
        </div>
    );
}

// ── Selector de empresa condicional ────────────────────────────
function EmpresaSelector({
    rol, clienteId, onChange, clientes,
}: {
    rol: string; clienteId: string; onChange: (v: string) => void; clientes: ClienteOption[];
}) {
    const isUsuario = rol === 'usuario';
    if (!isUsuario) return null;

    return (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                Empresa / Cliente *
            </label>
            <CustomSelect
                id="empresa-select"
                name="cliente_id"
                value={clienteId}
                onChange={onChange}
                placeholder="Seleccionar empresa…"
                options={clientes.map(c => ({ value: c.id, label: c.nombre_fantasia }))}
                required
            />
            <p className="mt-1 text-[11px] text-slate-400 font-medium">
                El usuario solo verá tickets y catálogo de esta empresa.
            </p>
        </div>
    );
}

// ── Modal: Crear Usuario ───────────────────────────────────────
function ModalCrear({
    onClose, onSuccess, clientes,
}: {
    onClose: () => void; onSuccess: () => void; clientes: ClienteOption[];
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]           = useState('');
    const [showPass, setShowPass]     = useState(false);
    const [rol, setRol]               = useState('');
    const [clienteId, setClienteId]   = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (!rol) { setError('Debes seleccionar un rol.'); return; }
        if (rol === 'usuario' && !clienteId) { setError('Debes seleccionar la empresa del usuario.'); return; }

        const fd = new FormData(e.currentTarget);
        fd.set('rol', rol);
        fd.set('cliente_id', rol === 'usuario' ? clienteId : '');

        startTransition(async () => {
            const res = await crearUsuarioAction(fd);
            if (res.error) setError(res.error);
            else { onSuccess(); onClose(); }
        });
    };

    return (
        <ModalBackdrop onClose={() => !isPending && onClose()}>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10">
                <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl"><UserPlus className="w-5 h-5 text-white" /></div>
                    <div>
                        <h3 className="text-base font-black text-white">Nuevo Usuario</h3>
                        <p className="text-xs text-indigo-200 font-medium">Crear cuenta en el sistema</p>
                    </div>
                    <button onClick={onClose} disabled={isPending} title="Cerrar" className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Rol *</label>
                        <CustomSelect
                            id="crear-rol"
                            name="rol"
                            value={rol}
                            onChange={(v) => { setRol(v); if (ROLES_STAFF.includes(v)) setClienteId(''); }}
                            placeholder="Seleccionar rol…"
                            options={ROLES.map(r => ({ value: r.value, label: r.label }))}
                            required
                        />
                    </div>

                    {/* Selector de empresa — aparece solo si rol = 'usuario' */}
                    <EmpresaSelector rol={rol} clienteId={clienteId} onChange={setClienteId} clientes={clientes} />

                    {/* Indicador visual para staff de Systel */}
                    {rol && ROLES_STAFF.includes(rol) && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 text-indigo-700 text-xs font-medium animate-in fade-in duration-200">
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                            Staff de Systel — acceso transversal a todos los clientes.
                        </div>
                    )}

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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-40">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            {isPending ? 'Creando…' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalBackdrop>
    );
}

// ── Modal: Editar Usuario ──────────────────────────────────────
function ModalEditar({
    usuario, onClose, onSuccess, clientes,
}: {
    usuario: Usuario; onClose: () => void; onSuccess: () => void; clientes: ClienteOption[];
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]           = useState('');
    const [rol, setRol]               = useState(usuario.rol?.toLowerCase() ?? 'usuario');
    const [clienteId, setClienteId]   = useState(usuario.cliente_id ?? '');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (rol === 'usuario' && !clienteId) { setError('Debes seleccionar la empresa del usuario.'); return; }

        const fd = new FormData(e.currentTarget);
        fd.set('id', usuario.id);
        fd.set('rol', rol);
        fd.set('cliente_id', rol === 'usuario' ? clienteId : '');

        startTransition(async () => {
            const res = await actualizarUsuarioAction(fd);
            if (res.error) setError(res.error);
            else { onSuccess(); onClose(); }
        });
    };

    return (
        <ModalBackdrop onClose={() => !isPending && onClose()}>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10">
                <div className="bg-slate-800 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/15 rounded-xl"><Pencil className="w-5 h-5 text-white" /></div>
                    <div>
                        <h3 className="text-base font-black text-white">Editar Usuario</h3>
                        <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">{usuario.email}</p>
                    </div>
                    <button onClick={onClose} disabled={isPending} title="Cerrar" className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                        <input name="nombre" type="text" required defaultValue={usuario.full_name ?? ''}
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Rol *</label>
                        <CustomSelect
                            id="editar-rol"
                            name="rol"
                            value={rol}
                            onChange={(v) => { setRol(v); if (ROLES_STAFF.includes(v)) setClienteId(''); }}
                            placeholder="Seleccionar rol…"
                            options={ROLES.map(r => ({ value: r.value, label: r.label }))}
                            required
                        />
                    </div>

                    {/* Selector de empresa condicional */}
                    <EmpresaSelector rol={rol} clienteId={clienteId} onChange={setClienteId} clientes={clientes} />

                    {/* Indicador staff */}
                    {ROLES_STAFF.includes(rol) && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 text-indigo-700 text-xs font-medium animate-in fade-in duration-200">
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                            Staff de Systel — acceso transversal a todos los clientes.
                        </div>
                    )}

                    <p className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <span className="font-black text-slate-600">Nota:</span> Para cambiar la contraseña, el usuario debe usar la opción &quot;Olvidé mi contraseña&quot;.
                    </p>

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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-black rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95 disabled:opacity-40">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {isPending ? 'Guardando…' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalBackdrop>
    );
}

// ── Modal: Eliminar Usuario ────────────────────────────────────
function ModalEliminar({ usuario, onClose, onSuccess }: {
    usuario: Usuario; onClose: () => void; onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError]   = useState('');
    const [confirm, setConfirm] = useState('');
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
                    <button onClick={onClose} disabled={isPending} title="Cerrar" className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-red-800">
                            Vas a eliminar la cuenta de <span className="font-black">{usuario.full_name || 'Este usuario'}</span> ({usuario.email}).
                            Se borrará su acceso permanentemente.
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

// ── Componente Principal ───────────────────────────────────────
export function GestionUsuariosClient({
    usuarios: initialUsuarios,
    clientes,
}: {
    usuarios: Usuario[];
    clientes: ClienteOption[];
}) {
    const router = useRouter();
    const [search, setSearch]             = useState('');
    const [filtroRol, setFiltroRol]       = useState('todos');
    const [modalCrear, setModalCrear]     = useState(false);
    const [modalEditar, setModalEditar]   = useState<Usuario | null>(null);
    const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null);

    const handleRefresh = useCallback(() => router.refresh(), [router]);

    const usuariosFiltrados = initialUsuarios.filter(u => {
        const matchSearch = search === '' ||
            (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (u.empresa ?? '').toLowerCase().includes(search.toLowerCase());
        const matchRol = filtroRol === 'todos' || u.rol?.toLowerCase() === filtroRol;
        return matchSearch && matchRol;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Gestión de Personal</h1>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                            {initialUsuarios.length} usuario{initialUsuarios.length !== 1 ? 's' : ''} en el sistema
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button onClick={handleRefresh} title="Actualizar"
                        className="p-2.5 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white shadow-sm">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setModalCrear(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" /> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o empresa…"
                        className="w-full border-2 border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    />
                </div>
                <CustomSelect
                    id="filtro-rol"
                    value={filtroRol}
                    onChange={setFiltroRol}
                    placeholder="Todos los roles"
                    options={[
                        { value: 'todos', label: 'Todos los roles' },
                        ...ROLES.map(r => ({ value: r.value, label: r.label }))
                    ]}
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Email</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Empresa</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">Creado</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {usuariosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-slate-400">
                                        <Users className="w-8 h-8 mx-auto mb-3 text-slate-200" />
                                        <p className="text-sm font-medium">
                                            {search || filtroRol !== 'todos' ? 'No hay usuarios que coincidan.' : 'Aún no hay usuarios registrados.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : usuariosFiltrados.map(u => {
                                const rolCfg  = getRolConfig(u.rol);
                                const initials = (u.full_name ?? u.email ?? '?').charAt(0).toUpperCase();
                                const isStaff  = u.rol ? ROLES_STAFF.includes(u.rol) : false;

                                return (
                                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                                        {/* Usuario */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{u.full_name || '—'}</p>
                                                    <p className="text-xs text-slate-400 font-medium md:hidden truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm font-medium text-slate-600 truncate">{u.email || '—'}</span>
                                        </td>

                                        {/* Rol */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wider ${rolCfg.color}`}>
                                                <Shield className="w-3 h-3" />
                                                {rolCfg.label}
                                            </span>
                                        </td>

                                        {/* Empresa */}
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            {isStaff ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                    <span className="text-xs font-bold text-indigo-600">Systel</span>
                                                </div>
                                            ) : u.empresa ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{u.empresa}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Sin empresa</span>
                                            )}
                                        </td>

                                        {/* Creado */}
                                        <td className="px-6 py-4 hidden xl:table-cell">
                                            <span className="text-xs font-medium text-slate-500">{timeAgo(u.created_at)}</span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setModalEditar(u)} title="Editar usuario"
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setModalEliminar(u)} title="Eliminar usuario"
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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

                {/* Footer tabla */}
                {usuariosFiltrados.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                            Mostrando {usuariosFiltrados.length} de {initialUsuarios.length} usuarios
                        </span>
                        <div className="flex gap-4 flex-wrap">
                            {ROLES.map(r => {
                                const count = initialUsuarios.filter(u => u.rol?.toLowerCase() === r.value).length;
                                if (count === 0) return null;
                                return (
                                    <span key={r.value} className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${r.color}`}>
                                        {r.label}: {count}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modales */}
            {modalCrear   && <ModalCrear    onClose={() => setModalCrear(false)}    onSuccess={handleRefresh} clientes={clientes} />}
            {modalEditar  && <ModalEditar   usuario={modalEditar}  onClose={() => setModalEditar(null)}   onSuccess={handleRefresh} clientes={clientes} />}
            {modalEliminar && <ModalEliminar usuario={modalEliminar} onClose={() => setModalEliminar(null)} onSuccess={handleRefresh} />}
        </div>
    );
}
