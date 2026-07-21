'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Calendar, Building2, User, RefreshCw, Contact, Briefcase, Users, Settings, Compass } from "lucide-react";
import { signOutUser } from "@/lib/firebase/auth";
import { useAuth } from "@/context/AuthContext";
import KpiCards from "../components/KpiCards";
import MetricsChart from "../components/MetricsChart";

const clients = [
  { id: "all", name: "Todos los Clientes (España)" },
  { id: "telefonica", name: "Telefónica S.A. (Madrid)" },
  { id: "inditex", name: "Inditex S.A. (Arteixo)" },
  { id: "mercadona", name: "Mercadona S.A. (Valencia)" },
  { id: "santander", name: "Banco Santander (Madrid)" },
  { id: "seat", name: "SEAT S.A. (Barcelona)" },
  { id: "iberdrola", name: "Iberdrola S.A. (Bilbao)" },
];

const dateRanges = [
  { id: "7d", name: "Últimos 7 días" },
  { id: "30d", name: "Últimos 30 días" },
  { id: "90d", name: "Últimos 90 días" },
  { id: "ytd", name: "Año en Curso" },
];

const recentSearches = [
  { company: "Telefónica S.A.", role: "Product Manager Tech", location: "Madrid", candidates: 18, status: "Entrevistas", date: "Hace 2d" },
  { company: "SEAT S.A.", role: "Software Architect Rust", location: "Barcelona", candidates: 12, status: "En Proceso", date: "Hace 4d" },
  { company: "Inditex S.A.", role: "Frontend Dev (React/Node)", location: "A Coruña / Remoto", candidates: 34, status: "Activo", date: "Hace 1d" },
  { company: "Banco Santander", role: "SecOps Specialist", location: "Madrid", candidates: 9, status: "Oferta Enviada", date: "Hace 6d" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Read the token cookie to show session info on client
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("azul_ats_token="));
    if (tokenCookie) {
      setSessionToken(tokenCookie.split("=")[1]);
    }
  }, []);

  // Client-side authentication protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
    router.refresh();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Ambient glow backgrounds */}
      <div className="ambient-blur-1 top-20 right-20 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-20 left-20 pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Upper Brand Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-[#0d9488]/20">
              <LayoutDashboard className="w-6 h-6 text-[#101415]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard Gerencial</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#6bd8cb]/15 text-[#6bd8cb] border border-[#6bd8cb]/25 rounded-md animate-pulse">
                  BETA V1.2
                </span>
              </div>
              <p className="text-xs text-[#879391]">Recruitment Business Analytics • Azul ATS</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center flex-wrap gap-3">
              {/* Grupo 1: Navegación Global */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                <div 
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white flex items-center gap-1.5 select-none"
                  title="Dashboard (Página Actual)"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </div>

                <Link
                  href="/busquedas"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Búsquedas</span>
                </Link>

                <Link
                  href="/talento"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Contact className="w-4 h-4" />
                  <span className="hidden sm:inline">Postulantes</span>
                </Link>
              </div>

              {/* Separador visual */}
              <div className="text-white/20 select-none text-xs font-light hidden sm:block">|</div>

              {/* Grupo 2: Navegación Contextual del Pipeline */}
              <div className="flex items-center gap-1 bg-[#9b5de5]/5 border border-[#9b5de5]/20 rounded-xl p-1 shadow-inner">
                <Link
                  href="/descubrimiento"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c4c1fb] hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span className="hidden sm:inline">F1 Descubrimiento</span>
                </Link>

                <Link
                  href="/evaluacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9b5de5] hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-[#9b5de5]" />
                  <span className="hidden sm:inline">F2 Evaluación</span>
                </Link>

                <Link
                  href="/presentacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">F3 Cliente</span>
                </Link>

                <Link
                  href="/cierre"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline">F4 Cierre</span>
                </Link>
              </div>

              <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block"></div>

              <button
                onClick={handleRefresh}
                className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all ${
                  refreshing ? "animate-spin text-[#6bd8cb]" : "text-[#c4c1fb]"
                }`}
                title="Actualizar Datos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#ffb4ab] border border-[#ffb4ab]/25 bg-red-950/20 hover:bg-red-950/40 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Global Filter Bar */}
        <section className="glass-panel rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row items-center gap-4 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-[#c4c1fb] uppercase tracking-wider md:border-r md:border-white/15 md:pr-4 md:mr-2">
            <span>Filtros Generales</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto md:flex md:items-center">
            {/* Client Selector */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-sm w-full md:w-64">
              <Building2 className="w-4 h-4 text-[#6bd8cb] shrink-0" />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-transparent border-0 text-white outline-none w-full cursor-pointer text-xs font-medium"
              >
                {clients.map((cl) => (
                  <option key={cl.id} value={cl.id} className="bg-[#101415] text-white">
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-sm w-full md:w-48">
              <Calendar className="w-4 h-4 text-[#6bd8cb] shrink-0" />
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="bg-transparent border-0 text-white outline-none w-full cursor-pointer text-xs font-medium"
              >
                {dateRanges.map((range) => (
                  <option key={range.id} value={range.id} className="bg-[#101415] text-white">
                    {range.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden xl:block ml-auto text-xs text-[#879391] italic">
            Datos actualizados en tiempo real mediante sync de Firestore y BigQuery.
          </div>
        </section>

        {/* Metric Cards Row */}
        <section className="space-y-2">
          <KpiCards />
        </section>

        {/* Analytical Grids */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recharts chart placeholder */}
          <div className="lg:col-span-2">
            <MetricsChart />
          </div>

          {/* Side panel: session metadata & Spain active flows */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Search list detail */}
            <div className="glass-panel rounded-2xl p-6 backdrop-blur-md flex-grow flex flex-col justify-between">
              <div className="space-y-1 mb-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#c4c1fb]">
                  Procesos Activos Recientes
                </h3>
                <p className="text-[11px] text-[#879391]">Últimas búsquedas asignadas en España</p>
              </div>

              <div className="space-y-3.5 flex-grow">
                {recentSearches.map((search, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#191c1e]/70 border border-white/5 rounded-xl hover:border-[#6bd8cb]/20 transition-all flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-white">{search.role}</div>
                      <div className="text-[10px] text-[#879391] flex items-center gap-1.5">
                        <span>{search.company}</span>
                        <span>•</span>
                        <span>{search.location}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#6bd8cb]/10 text-[#6bd8cb] rounded border border-[#6bd8cb]/15">
                        {search.status}
                      </span>
                      <span className="text-[9px] text-[#879391]">{search.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter metadata token details */}
            <div className="glass-panel rounded-2xl p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#c4c1fb] uppercase tracking-wider">
                <User className="w-4 h-4 text-[#6bd8cb]" />
                <span>Sesión de Reclutador</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-col gap-1 p-2.5 bg-[#101415] border border-white/5 rounded-lg">
                  <span className="text-[9px] text-[#879391] uppercase font-bold tracking-wider">Token ID Cookie</span>
                  <code className="text-[10px] text-[#6bd8cb] font-mono truncate select-all block">
                    {sessionToken || "Demo-Active-Mode-Token"}
                  </code>
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-[#879391]">
                  <span>Acceso de Seguridad</span>
                  <span className="font-bold text-emerald-400">Verificado (Edge Proxy)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
