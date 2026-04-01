import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ForcePasswordForm from './ForcePasswordForm';

export default async function ForcePasswordPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Si ya cambió la contraseña, no tiene que estar aquí
    const { data: profile } = await supabase
        .from('profiles')
        .select('debe_cambiar_password, full_name')
        .eq('id', user.id)
        .maybeSingle();

    if (!profile?.debe_cambiar_password) redirect('/dashboard');

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Cambio de contraseña requerido</h1>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                        Hola <span className="font-bold text-slate-700">{profile.full_name ?? user.email}</span>,
                        por seguridad debes establecer una contraseña personal antes de continuar.
                    </p>
                </div>

                <ForcePasswordForm />
            </div>
        </div>
    );
}
