import { getTechnicianMochilaGroupedAction } from '../actions';
import { MochilaClient } from './MochilaClient';
import { PackageOpen } from 'lucide-react';

export default async function TecnicoMochilaPage() {
    const response = await getTechnicianMochilaGroupedAction();

    if ('error' in response) {
        if (response.error === 'NO_MOCHILA') {
            return (
                <div className="p-6 max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PackageOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Mochila No Asignada</h2>
                        <p className="text-slate-500 font-medium">Aún no tienes una mochila virtual asignada. Contacta a un administrador.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm">
                    {response.error}
                </div>
            </div>
        );
    }

    return (
        <MochilaClient
            grupos={response.grupos}
            mochilaNombre={response.mochilaNombre}
        />
    );
}
