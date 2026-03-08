import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user, supabase } = await updateSession(request)

    const url = request.nextUrl.clone()

    // Define redirect helper to preserve cookies
    const redirect = (destination: URL) => {
        const redirectResponse = NextResponse.redirect(destination)
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    if ((url.pathname.startsWith('/dashboard') || url.pathname === '/') && !user) {
        url.pathname = '/login'
        return redirect(url)
    }

    if (user) {
        // Query the database directly for the real role
        const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        // Fallback to metadata if profile is not found for some reason, 
        // but prefer database source of truth.
        const role = profile?.role || user.user_metadata?.role

        console.log('-----------------------------------');
        console.log('MID-WARE ERROR DB:', dbError?.message);
        console.log('MID-WARE ROL EN BD:', profile?.role);
        console.log('MID-WARE ROL EN METADATA:', user.user_metadata?.role);
        console.log('MID-WARE ROL DECIDIDO:', role);
        console.log('MID-WARE URL INTENTO:', url.pathname);
        console.log('-----------------------------------');

        if (url.pathname === '/login' || url.pathname === '/') {
            url.pathname = role === 'AGENTE' ? '/dashboard/agente' : '/dashboard/solicitante'
            return redirect(url)
        }

        // Shared route bypass: Both Roles can access generic /dashboard/ticket/[id]
        if (url.pathname.startsWith('/dashboard/ticket/')) {
            return supabaseResponse;
        }

        if (url.pathname.startsWith('/dashboard/agente') && role !== 'AGENTE') {
            url.pathname = '/dashboard/solicitante'
            return redirect(url)
        }

        if (url.pathname.startsWith('/dashboard/solicitante') && role === 'AGENTE') {
            url.pathname = '/dashboard/agente'
            return redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
