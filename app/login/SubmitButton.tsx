'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { login } from './actions';

export function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            formAction={login}
            disabled={pending}
            className="w-full flex justify-center py-3 px-4 rounded-[10px] shadow-sm text-sm font-semibold text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Ingresando...
                </>
            ) : (
                'Ingresar'
            )}
        </button>
    );
}
