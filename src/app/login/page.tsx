'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginWithEmail, loginWithGoogle } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      let message = "No se pudo iniciar sesión con Google.";
      if (err.code === "auth/popup-closed-by-user") {
        message = "La ventana de inicio de sesión de Google fue cerrada antes de completarse.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCredSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      let message = "Error al autenticar credenciales.";
      if (
        err.code === "auth/invalid-credential" || 
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password"
      ) {
        message = "Credenciales incorrectas. Verifique su correo electrónico y contraseña.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Acceso bloqueado temporalmente por demasiados intentos fallidos. Intente más tarde.";
      } else if (err.code === "auth/invalid-email") {
        message = "El formato de correo electrónico ingresado no es válido.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden select-none bg-[#101415]">
      {/* Ambient background blur blobs */}
      <div className="ambient-blur-1 top-10 left-10"></div>
      <div className="ambient-blur-2 bottom-10 right-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-[#0d9488]/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md z-10">
        {/* Glassmorphic Panel Card */}
        <div className="glass-panel glow-effect rounded-2xl shadow-2xl p-8 backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <span className="text-[#101415] text-2xl font-black tracking-tighter">A</span>
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e0e3e5] to-secondary tracking-tight mb-1">
              Azul ATS
            </h1>
            <p className="text-xs text-[#879391] uppercase tracking-widest font-semibold">
              Recruitment Platform
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/30 rounded-lg p-3 text-red-300 text-xs mb-6 animate-pulse">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dynamic Form */}
          <form onSubmit={handleCredSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879391]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@digitalagil.com"
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#c4c1fb] uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879391]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 glass-input rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879391] hover:text-[#e0e3e5]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glow-btn bg-primary text-[#101415] hover:bg-[#6bd8cb] py-3 rounded-xl font-bold text-sm transition-all focus:outline-none flex items-center justify-center gap-1.5 shadow-lg shadow-[#0d9488]/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#101415] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 text-[10px] uppercase font-bold text-[#879391] tracking-widest">
              o continuar con
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Social Sign-In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full bg-[#191c1e] hover:bg-[#272a2c] text-[#e0e3e5] border border-white/10 py-3 rounded-xl font-semibold text-sm transition-all focus:outline-none flex items-center justify-center gap-2 hover:border-[#6bd8cb]/30 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Iniciar con Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
