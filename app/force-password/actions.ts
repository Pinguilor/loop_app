'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function cambiarPasswordAction(formData: FormData): Promise<{ error: string } | never> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const passwordActual  = (formData.get('password_actual')  as string)?.trim();
    const passwordNueva   = (formData.get('password_nueva')   as string)?.trim();
    const passwordConfirm = (formData.get('password_confirm') as string)?.trim();

    if (!passwordActual || !passwordNueva || !passwordConfirm) {
        return { error: 'Todos los campos son obligatorios.' };
    }
    if (passwordNueva.length < 8) {
        return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    }
    if (passwordNueva !== passwordConfirm) {
        return { error: 'La nueva contraseña y su confirmación no coinciden.' };
    }
    if (passwordNueva === passwordActual) {
        return { error: 'La nueva contraseña no puede ser igual a la contraseña actual.' };
    }

    // Verificar la contraseña actual re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    user.email!,
        password: passwordActual,
    });
    if (signInError) {
        return { error: 'La contraseña actual es incorrecta.' };
    }

    // Actualizar contraseña en Auth
    const { error: updateError } = await supabase.auth.updateUser({ password: passwordNueva });
    if (updateError) {
        return { error: `Error al actualizar la contraseña: ${updateError.message}` };
    }

    // Marcar que ya no debe cambiar contraseña (admin client bypasa RLS)
    const adminSupabase = getAdminClient();
    const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({ debe_cambiar_password: false })
        .eq('id', user.id);

    if (profileError) {
        return { error: `Error al actualizar el perfil: ${profileError.message}` };
    }

    redirect('/dashboard');
}
