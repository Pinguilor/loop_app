import { LoginForm } from './LoginForm'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: "url('/login-bg-ai.png')" }}>
            {/* Subtle dark overlay */}
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-0"></div>

            <div className="relative z-10 w-full max-w-4xl bg-slate-50/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] border border-white/40">

                {/* Left Side (Logo & Bienvenido) */}
                {/* 👇 FIX: Quitamos el min-h-[500px] fijo y lo dejamos solo para PC (md:min-h-[500px]). Redujimos el padding en celular (p-6) */}
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col relative md:min-h-[500px]">
                    {/* Capa de luz sutil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 pointer-events-none"></div>

                    {/* RECUADRO 1: Logo */}
                    <div className="flex-1 flex items-center justify-center relative z-10 w-full py-4 md:py-0">
                        <div className="hover:scale-110 transition-transform duration-500">
                            <Image
                                src="/looplogo-login.png"
                                alt="Logo Loop Login"
                                width={450}
                                height={150}
                                className="w-40 md:w-80 h-auto object-contain drop-shadow-md"
                                priority
                            />
                        </div>
                    </div>

                    {/* RECUADRO 2: Bienvenido */}
                    {/* 👇 FIX: mt-4 en celular para que esté pegadito al logo, mt-auto en PC para que baje. Centrado en celular, a la izquierda en PC */}
                    <div className="relative z-10 mt-2 md:mt-auto text-center md:text-left">
                        <h1 className="text-sm font-semibold text-slate-500 tracking-wide uppercase opacity-70">
                            Bienvenido
                        </h1>
                    </div>
                </div>

                {/* Right Side (Client component for Error State and Form) */}
                <LoginForm />
            </div>

            <div className="absolute bottom-4 text-xs text-white/50 font-medium z-10 w-full text-center">
                &copy; {new Date().getFullYear()} Mesa de Ayuda Corporativa.
            </div>
        </div>
    )
}