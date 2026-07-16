"use client";

import { useState, useActionState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { loginAction, registerAction } from "@/app/actions/auth-actions";
import { ArrowRight, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  const [loginState, runLoginAction, isLoginPending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await loginAction(prevState, formData);
      return result || { error: null };
    },
    { error: null as string | null }
  );

  const [registerState, runRegisterAction, isRegisterPending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await registerAction(prevState, formData);
      return result || { error: null };
    },
    { error: null as string | null }
  );

  const error = activeTab === "login" ? loginState.error : registerState.error;
  const isPending = activeTab === "login" ? isLoginPending : isRegisterPending;

  return (
    <main className="flex min-h-screen flex-col bg-brand-bg text-gray-100 selection:bg-brand-accent/20 selection:text-white justify-between font-sans relative overflow-hidden">
      {/* Glow e sfondi atmosferici per la pagina login */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/15 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-10 w-[350px] h-[350px] bg-brand-third/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <Header />
      
      <div className="flex-1 flex items-center justify-center px-6 py-32 md:py-40">
        <div className="w-full max-w-md bg-brand-dark/90 border border-white/15 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-chillax font-bold tracking-wide text-white">
              Area Riservata
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Accedi o crea il tuo profilo per gestire i procedimenti
            </p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl mb-8 border border-white/10">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-brand-primary text-white shadow-md font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-brand-primary text-white shadow-md font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Registrati
            </button>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/40 text-red-200 text-sm p-3.5 rounded-xl mb-6 text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          {activeTab === "login" ? (
            <form action={runLoginAction} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                  Email o Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    name="loginInput"
                    required
                    placeholder="nomeutente o email@esempio.it"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-accent hover:bg-orange-600 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 mt-2 shadow-lg hover:shadow-orange-500/25 disabled:opacity-50"
              >
                {isPending ? "Accesso in corso..." : "Accedi"}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form action={runRegisterAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Nome e Cognome *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="nomeCognome"
                    required
                    placeholder="Mario Rossi"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="mario.rossi@esempio.it"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Telefono (Opzionale)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="+39 333 1234567"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Username *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="mariorossi"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/50">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Scegli una password forte"
                    className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-accent hover:bg-orange-600 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 mt-4 shadow-lg hover:shadow-orange-500/25 disabled:opacity-50"
              >
                {isPending ? "Registrazione in corso..." : "Registrati e Accedi"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-white/60">
            I tuoi dati sono protetti in conformità con la normativa GDPR.
          </div>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
