'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { createChildTicketAction } from '../actions';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/app/dashboard/components/CustomSelect';

interface Props {
    ticketPadreId: string;
    clienteId: string | null;
    onClose: () => void;
}

export function AddChildTicketModal({ ticketPadreId, clienteId, onClose }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Catalog state — 4 levels
    const [tiposServicio, setTiposServicio] = useState<{ id: string; nombre: string }[]>([]);
    const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
    const [subcategorias, setSubcategorias] = useState<{ id: string; nombre: string }[]>([]);
    const [acciones, setAcciones] = useState<{ id: string; nombre: string }[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

    // Cascading selection state
    const [selectedTipoServicioId, setSelectedTipoServicioId] = useState('');
    const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
    const [selectedSubcategoriaId, setSelectedSubcategoriaId] = useState('');
    const [selectedAccionId, setSelectedAccionId] = useState('');

    const [prioridad, setPrioridad] = useState('media');

    // Level 1 — fetch Tipos de Servicio filtered by cliente_id
    useEffect(() => {
        async function fetchTipos() {
            setIsLoadingCatalog(true);
            const supabase = createClient();
            let query = supabase
                .from('ticket_tipos_servicio')
                .select('id, nombre')
                .eq('activo', true)
                .order('nombre');

            if (clienteId) query = query.eq('cliente_id', clienteId);

            const { data } = await query;
            if (data) setTiposServicio(data);
            setIsLoadingCatalog(false);
        }
        fetchTipos();
    }, [clienteId]);

    // Level 2 — fetch Categorías on tipo change
    useEffect(() => {
        if (!selectedTipoServicioId) { setCategorias([]); return; }
        async function fetchCategorias() {
            const supabase = createClient();
            const { data } = await supabase
                .from('ticket_categorias')
                .select('id, nombre')
                .eq('tipo_servicio_id', selectedTipoServicioId)
                .eq('activo', true)
                .order('nombre');
            if (data) setCategorias(data);
        }
        fetchCategorias();
    }, [selectedTipoServicioId]);

    // Level 3 — fetch Subcategorías on categoría change
    useEffect(() => {
        if (!selectedCategoriaId) { setSubcategorias([]); return; }
        async function fetchSubcategorias() {
            const supabase = createClient();
            const { data } = await supabase
                .from('ticket_subcategorias')
                .select('id, nombre')
                .eq('categoria_id', selectedCategoriaId)
                .eq('activo', true)
                .order('nombre');
            if (data) setSubcategorias(data);
        }
        fetchSubcategorias();
    }, [selectedCategoriaId]);

    // Level 4 — fetch Acciones on subcategoría change
    useEffect(() => {
        if (!selectedSubcategoriaId) { setAcciones([]); return; }
        async function fetchAcciones() {
            const supabase = createClient();
            const { data } = await supabase
                .from('ticket_acciones')
                .select('id, nombre')
                .eq('subcategoria_id', selectedSubcategoriaId)
                .eq('activo', true)
                .order('nombre');
            if (data) setAcciones(data);
        }
        fetchAcciones();
    }, [selectedSubcategoriaId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedTipoServicioId || !selectedCategoriaId || !selectedSubcategoriaId || !selectedAccionId) {
            setError('Por favor completa la clasificación completa de 4 niveles.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.append('ticketPadreId', ticketPadreId);
        formData.append('tipo_servicio_id', selectedTipoServicioId);
        formData.append('categoria_id', selectedCategoriaId);
        formData.append('subcategoria_id', selectedSubcategoriaId);
        formData.append('accion_id', selectedAccionId);
        formData.append('prioridad', prioridad);

        try {
            const result = await createChildTicketAction(formData);

            if (result.error) {
                setError(result.error);
            } else if (result.newTicketId) {
                router.push(`/dashboard/ticket/${result.newTicketId}`);
                onClose();
            }
        } catch {
            setError('Ocurrió un error inesperado al crear el ticket adicional.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start pt-24 pb-8 justify-center px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-y-auto max-h-[calc(100vh-8rem)] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200 custom-scrollbar">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-1.5 rounded-lg">
                            <Plus className="w-5 h-5 text-indigo-700" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Sumar Ticket Adicional</h2>
                    </div>
                    <button
                        onClick={onClose}
                        title="Cerrar modal"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="text-sm text-slate-500 mb-2">
                        El nuevo ticket heredará automáticamente el <span className="font-bold text-slate-700">restaurante</span> y el <span className="font-bold text-slate-700">cliente</span> del ticket actual, pero requiere tipificación.
                    </div>

                    {/* Fila 1: Tipo de Servicio + Categoría */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Tipo de Servicio</label>
                            <CustomSelect
                                id="tipo_servicio"
                                value={selectedTipoServicioId}
                                onChange={(val) => {
                                    setSelectedTipoServicioId(val);
                                    setSelectedCategoriaId('');
                                    setSelectedSubcategoriaId('');
                                    setSelectedAccionId('');
                                    setCategorias([]);
                                    setSubcategorias([]);
                                    setAcciones([]);
                                }}
                                options={tiposServicio.map(t => ({ value: t.id, label: t.nombre }))}
                                placeholder="Selecciona Tipo de Servicio..."
                                disabled={isLoadingCatalog}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Categoría Principal</label>
                            <CustomSelect
                                id="categoria"
                                value={selectedCategoriaId}
                                onChange={(val) => {
                                    setSelectedCategoriaId(val);
                                    setSelectedSubcategoriaId('');
                                    setSelectedAccionId('');
                                    setSubcategorias([]);
                                    setAcciones([]);
                                }}
                                options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
                                placeholder="Selecciona Categoría..."
                                disabled={!selectedTipoServicioId || isLoadingCatalog}
                                required
                            />
                        </div>
                    </div>

                    {/* Fila 2: Equipo / Subcategoría + Acción / Falla */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Equipo / Subcategoría</label>
                            <CustomSelect
                                id="subcategoria"
                                value={selectedSubcategoriaId}
                                onChange={(val) => {
                                    setSelectedSubcategoriaId(val);
                                    setSelectedAccionId('');
                                    setAcciones([]);
                                }}
                                options={subcategorias.map(s => ({ value: s.id, label: s.nombre }))}
                                placeholder="Selecciona Equipo..."
                                disabled={!selectedCategoriaId || isLoadingCatalog}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Acción / Falla</label>
                            <CustomSelect
                                id="accion"
                                value={selectedAccionId}
                                onChange={setSelectedAccionId}
                                options={acciones.map(a => ({ value: a.id, label: a.nombre }))}
                                placeholder="Selecciona Acción..."
                                disabled={!selectedSubcategoriaId || isLoadingCatalog}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="titulo" className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Asunto del Ticket</label>
                        <input
                            type="text"
                            id="titulo"
                            name="titulo"
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal"
                            placeholder="Ej: Revisión adicional requerida"
                        />
                    </div>

                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Descripción de la Tarea</label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            required
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal resize-none"
                            placeholder="Detalla lo que se necesita hacer en este ticket adicional..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">Prioridad</label>
                        <CustomSelect
                            id="prioridad"
                            name="prioridad"
                            value={prioridad}
                            onChange={setPrioridad}
                            options={[
                                { value: 'baja', label: 'Baja' },
                                { value: 'media', label: 'Media' },
                                { value: 'alta', label: 'Alta' },
                                { value: 'crítica', label: 'Crítica' }
                            ]}
                            placeholder="Seleccionar Prioridad"
                            required
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl transition-all shadow-sm"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                'Crear Ticket Adicional'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
