'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
  Ban, 
  Users, 
  LayoutDashboard, 
  Briefcase,
  Search,
  Filter,
  Contact,
  Settings
} from "lucide-react";

// Mock candidates suited for the Spanish recruiter market
const initialCandidates = [
  {
    id: "C-201",
    name: "Sofía Medina",
    role: "Senior React Developer",
    client: "Telefónica S.A.",
    location: "Madrid / Híbrido",
    phase: "screening",
    score: 88,
    matchDate: "11 Jul 2026"
  },
  {
    id: "C-202",
    name: "Marcos Sanz",
    role: "Software Architect Rust",
    client: "SEAT S.A.",
    location: "Barcelona / Remoto",
    phase: "entrevista_tecnica",
    score: 95,
    matchDate: "09 Jul 2026"
  },
  {
    id: "C-203",
    name: "Alejandro Costa",
    role: "Cloud Security Expert",
    client: "Banco Santander",
    location: "Madrid",
    phase: "screening",
    score: 82,
    matchDate: "10 Jul 2026"
  },
  {
    id: "C-204",
    name: "Helena Navarro",
    role: "UX/UI Designer",
    client: "Mercadona S.A.",
    location: "Valencia / Presencial",
    phase: "cliente_decision",
    score: 90,
    matchDate: "08 Jul 2026"
  },
  {
    id: "C-205",
    name: "Daniel Cabrera",
    role: "DevOps Engineer (Kubernetes)",
    client: "Amadeus España",
    location: "Madrid",
    phase: "screening",
    score: 79,
    matchDate: "12 Jul 2026"
  },
  {
    id: "C-206",
    name: "Lara Salgado",
    role: "Principal Data Engineer",
    client: "Iberdrola S.A.",
    location: "Bilbao / Remoto",
    phase: "entrevista_tecnica",
    score: 92,
    matchDate: "07 Jul 2026"
  },
  {
    id: "C-207",
    name: "Pablo Vega",
    role: "Security Analyst Lead",
    client: "Banco Santander",
    location: "Sevilla / Remoto España",
    phase: "contratado_oferta",
    score: 96,
    matchDate: "05 Jul 2026"
  }
];

// Kanban columns definitions
const PIPELINE_COLUMNS = [
  { key: "screening", label: "Bandeja de Entrada", colorClass: "border-t-[4px] border-t-[#c4c1fb]" },
  { key: "entrevista_tecnica", label: "Evaluación Técnica", colorClass: "border-t-[4px] border-t-[#6bd8cb]" },
  { key: "cliente_decision", label: "Revisión de Cliente", colorClass: "border-t-[4px] border-t-amber-400" },
  { key: "contratado_oferta", label: "Oferta & Cierre", colorClass: "border-t-[4px] border-t-emerald-400" }
];

export default function ReclutamientoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("Todos");

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

  // Filtering candidates by search query or client
  const filteredCandidates = initialCandidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesClient = 
      selectedClient === "Todos" || c.client === selectedClient;

    return matchesSearch && matchesClient;
  });

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Background ambient radial blurs consistent with Stitch */}
      <div className="ambient-blur-1 top-20 left-20 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-32 right-32 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Banner Headers */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#9b5de5] to-[#c4c1fb] flex items-center justify-center shadow-lg shadow-[#9b5de5]/20">
              <Users className="w-6 h-6 text-[#101415]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Módulo de Reclutamiento
                </span>
                <span className="text-[10px] font-bold text-white/40">Ref: Gestión de Flujo</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                Recruitment Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#c4c1fb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ver Dashboard</span>
            </Link>
            
            <Link
              href="/busquedas"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#6bd8cb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Ver Búsquedas</span>
            </Link>

            <Link
              href="/talento"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#6bd8cb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Contact className="w-4 h-4" />
              <span>Postulantes</span>
            </Link>

            <Link
              href="/configuracion"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#c4c1fb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </Link>
          </div>
        </header>

        {/* Filters control pane */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#879391]" />
            <input
              type="text"
              placeholder="Buscar candidato por nombre, rol o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/15 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
            <div className="flex items-center gap-2 text-xs text-[#879391]">
              <Filter className="w-4 h-4 text-[#c4c1fb]" />
              <span>Filtrar Cliente:</span>
            </div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer"
            >
              <option value="Todos" className="bg-[#15181a]">Todos los Clientes</option>
              <option value="Telefónica S.A." className="bg-[#15181a]">Telefónica S.A.</option>
              <option value="Banco Santander" className="bg-[#15181a]">Banco Santander</option>
              <option value="Inditex S.A." className="bg-[#15181a]">Inditex S.A.</option>
              <option value="SEAT S.A." className="bg-[#15181a]">SEAT S.A.</option>
              <option value="Mercadona S.A." className="bg-[#15181a]">Mercadona S.A.</option>
              <option value="Amadeus España" className="bg-[#15181a]">Amadeus España</option>
              <option value="Iberdrola S.A." className="bg-[#15181a]">Iberdrola S.A.</option>
            </select>
          </div>
        </div>

        {/* Kanban Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PIPELINE_COLUMNS.map((col) => {
            const colCandidates = filteredCandidates.filter((c) => c.phase === col.key);

            return (
              <div 
                key={col.key} 
                className={`rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[500px] ${col.colorClass}`}
              >
                {/* Column header */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-wide">{col.label}</span>
                    <span className="text-[10px] text-[#879391] mt-0.5">Ubicados en España</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#c4c1fb]">
                    {colCandidates.length}
                  </span>
                </div>

                {/* Candidates cards */}
                <div className="flex-grow space-y-3.5 overflow-y-auto">
                  {colCandidates.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                        Sin Postulantes
                      </span>
                    </div>
                  ) : (
                    colCandidates.map((cad) => (
                      <div 
                        key={cad.id}
                        className="p-4 rounded-xl border border-white/10 bg-[#15181a]/40 hover:bg-[#15181a]/95 hover:border-white/20 transition-all duration-200 group flex flex-col space-y-3.5 relative overflow-hidden"
                      >
                        {/* Match score bar indicator (top right decoration) */}
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono text-[#879391]">{cad.id}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            cad.score >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20"
                          }`}>
                            Fit: {cad.score}%
                          </span>
                        </div>

                        {/* Candidate Basic Details */}
                        <div>
                          <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-[#6bd8cb] transition-colors">
                            {cad.name}
                          </h3>
                          <p className="text-[10px] text-[#c4c1fb] mt-0.5 font-medium">{cad.role}</p>
                        </div>

                        {/* Spain Meta Detail Tags */}
                        <div className="space-y-1.5 pt-1.5 border-t border-white/5 text-[9px] text-[#879391]">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#c4c1fb]/60" />
                            <span className="truncate">{cad.client}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]/60" />
                            <span>{cad.location}</span>
                          </div>
                        </div>

                        {/* UI Action Buttons (Hover states with no functions logic) */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            className="flex-grow py-1.5 rounded-lg border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 hover:bg-[#6bd8cb] hover:text-[#101415] text-[10px] font-bold text-[#6bd8cb] transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Avanzar</span>
                            <ChevronRight className="w-3 h-3 shrink-0" />
                          </button>
                          
                          <button
                            type="button"
                            className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-red-400 text-[10px] transition-all flex items-center justify-center cursor-pointer"
                            title="Rechazar Candidato"
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
