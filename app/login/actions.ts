'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, use a schema validator like Zod
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    const role = authData.user?.user_metadata?.role

    revalidatePath('/', 'layout')
    if (role === 'AGENTE') {
        redirect('/dashboard/agente')
    } else {
        redirect('/dashboard/solicitante')
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                role: 'SOLICITANTE', // default role
            },
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Assuming email confirmations are turned off for smooth local development
    revalidatePath('/', 'layout')
    redirect('/dashboard/solicitante')
}
