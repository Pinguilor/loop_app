'use client';

import { useSearchParams } from 'next/navigation';
import { SubmitButton } from './SubmitButton';
import { ErrorMessage } from './ErrorMessage';
import { Suspense } from 'react';
import { login } from './actions';

function LoginFormContent() {
    const searchParams = useSearchParams();
    const error = searchParams?.get('error');

    return (
        <div className="md:w-1/2 p-10 border-l border-white/20 flex flex-col justify-center">

            <div className="text-center mb-8">
                {error ? (
                    <p className="text-red-500 font-bold whitespace-pre-line text-lg leading-relaxed animate-pulse">
                        {"Por favor, verifique los datos\ningresados."}
                    </p>
                ) : (
                    <p className="text-slate-600 font-bold whitespace-pre-line text-lg leading-relaxed">
                        {"Por favor ingrese sus datos para\niniciar sesión."}
                    </p>
                )}
            </div>

            <ErrorMessage />

            <form className="space-y-4 max-w-sm mx-auto w-full">
                <div>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none block w-full pl-4 pr-10 py-3 border border-slate-300 rounded-[10px] shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm text-slate-900 bg-white/80"
                            placeholder="Correo / Nombre de usuario"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none block w-full pl-4 pr-10 py-3 border border-slate-300 rounded-[10px] shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm text-slate-900 bg-white/80"
                            placeholder="Contraseña"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}

export function LoginForm() {
    return (
        <Suspense fallback={
            <div className="md:w-1/2 p-10 border-l border-white/20 flex flex-col justify-center items-center">
                <div className="animate-pulse w-8 h-8 rounded-full bg-white/20"></div>
            </div>
        }>
            <LoginFormContent />
        </Suspense>
    );
}
