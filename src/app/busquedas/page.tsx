'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Search, 
  Plus, 
  Briefcase, 
  MapPin, 
  Building2, 
  Calendar, 
  Users, 
  SlidersHorizontal,
  FolderDot,
  LayoutDashboard,
  AlertCircle,
  Contact,
  Settings,
  Compass
} from "lucide-react";
import SlideOver from "../components/SlideOver";
import SearchForm from "../components/SearchForm";
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";

export default function BusquedasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searches, setSearches] = useState<Busqueda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<Busqueda | undefined>(undefined);

  const handleEditClick = (item: Busqueda) => {
    setSelectedSearch(item);
    setIsSlideOpen(true);
  };

  // Client-side authentication redirection guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch searches helper
  const fetchSearches = async () => {
    setLoading(true);
    try {
      const data = await getBusquedasAPI();
      setSearches(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching searches from API:", err);
      setError(err.message || "No se pudo recuperar los registros de búsquedas en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch only when user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      fetchSearches();
    }
  }, [user, authLoading]);

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

  // Live filter evaluation
  const filteredSearches = searches.filter((item) => {
    const matchesSearch = 
      (item.perfil_busqueda || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.responsable_operativo || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      selectedStatus === "Todos" || item.estado_fase === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Background radial blurs */}
      <div className="ambient-blur-1 top-20 right-20 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-20 left-20 pointer-events-none"></div>

      {/* Slide-over creation/edit panel */}
      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => {
          setIsSlideOpen(false);
          setSelectedSearch(undefined);
        }}
        title={selectedSearch ? "Editar Búsqueda" : "Crear Nueva Búsqueda"}
        submitLabel={selectedSearch ? "Actualizar Búsqueda" : "Guardar Búsqueda"}
        isSubmitting={isSubmitting}
      >
        <SearchForm
          initialData={selectedSearch}
          onSuccess={() => {
            setIsSlideOpen(false);
            setSelectedSearch(undefined);
            fetchSearches(); // Refresh table automatically
          }}
          onClose={() => {
            setIsSlideOpen(false);
            setSelectedSearch(undefined);
          }}
          onSubmittingChange={setIsSubmitting}
        />
      </SlideOver>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Banner navigation header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-[#0d9488]/20">
              <FolderDot className="w-6 h-6 text-[#101415]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#c4c1fb] tracking-widest">Maestro de Búsquedas</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#879391]/10 text-[#879391] border border-white/5 rounded">Ref: Módulo C</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Gestión de Posiciones</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ver Dashboard</span>
            </Link>

            <Link
              href="/descubrimiento"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>F1 Descubrimiento</span>
            </Link>

            {/*
            <Link
              href="/reclutamiento"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Reclutamiento</span>
            </Link>
            */}

            <Link
              href="/talento"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#6bd8cb] border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Contact className="w-4 h-4" />
              <span>Postulantes</span>
            </Link>

            <Link
              href="/configuracion"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </Link>

            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

            <button
              onClick={() => {
                setSelectedSearch(undefined);
                setIsSlideOpen(true);
              }}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 transition-all shadow-md shadow-[#0d9488]/15 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Nueva Búsqueda</span>
            </button>
          </div>
        </header>

        {/* Filter controls panel */}
        <section className="glass-panel rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row items-center gap-4.5 border border-white/10">
          
          {/* Text search widget */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm w-full md:flex-grow">
            <Search className="w-4.5 h-4.5 text-[#879391] shrink-0" />
            <input
              type="text"
              placeholder="Buscar por cargo, cliente o responsable operativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 text-white outline-none w-full text-xs font-medium placeholder-[#879391]"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm w-full md:w-60">
            <SlidersHorizontal className="w-4 h-4 text-[#6bd8cb] shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-0 text-white outline-none w-full cursor-pointer text-xs font-bold"
            >
              <option value="Todos" className="bg-[#101415] text-white">Todos los Estados</option>
              <option value="Abierta" className="bg-[#101415] text-[#6bd8cb]">Abierta</option>
              <option value="Pausada" className="bg-[#101415] text-amber-500">Pausada</option>
              <option value="Cerrada" className="bg-[#101415] text-[#879391]">Cerrada</option>
              <option value="preparacion_previa" className="bg-[#101415] text-[#6bd8cb]">Preparación Previa</option>
              <option value="evaluacion_tecnica" className="bg-[#101415] text-amber-500">Evaluación Técnica</option>
              <option value="revision_cliente" className="bg-[#101415] text-purple-400">Revisión de Cliente</option>
              <option value="oferta_cierre" className="bg-[#101415] text-blue-400">Oferta & Cierre</option>
            </select>
          </div>
        </section>

        {/* Modern Data Table */}
        <section className="glass-panel rounded-2xl overflow-hidden backdrop-blur-md border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#161a1b]/60 text-xs font-bold tracking-wider text-[#c4c1fb]">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Posición</th>
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Ubicación</th>
                  <th className="py-4 px-6">Candidatos</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Creado</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-[#879391] font-medium tracking-wide">Cargando procesos desde la API...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-xs text-red-400 border border-red-500/10 bg-red-950/5">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <span>{error}</span>
                        <button 
                          onClick={fetchSearches} 
                          className="mt-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#e0e3e5] hover:bg-white/10 transition-all font-bold cursor-pointer"
                        >
                          Reintentar Carga
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredSearches.length > 0 ? (
                  filteredSearches.map((item) => (
                    <tr 
                      key={item.id}
                      onClick={() => handleEditClick(item)}
                      className="group hover:bg-white/[0.04] transition-colors duration-250 cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-[#879391]">
                        {item.id.substring(0, 8)}
                      </td>
                      <td className="py-4 px-6 font-bold group-hover:text-[#6bd8cb] transition-colors">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#879391] group-hover:text-[#6bd8cb]" />
                          <span>{item.perfil_busqueda}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-[#e0e3e5]">
                          <Building2 className="w-3.5 h-3.5 text-[#879391]" />
                          <span>{item.cliente}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-[#879391]">
                          <MapPin className="w-3.5 h-3.5 text-[#879391]" />
                          <span>España</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users className="w-3.5 h-3.5 text-[#c4c1fb]" />
                          <span>{item.candidatos_contador ?? 0} candidatos</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                          item.estado_fase === "preparacion_previa" || item.estado_fase === "Abierta" || item.estado_fase === "abierta" ? "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20" :
                          item.estado_fase === "evaluacion_tecnica" || item.estado_fase === "Pausada" || item.estado_fase === "pausada" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          item.estado_fase === "revision_cliente" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                          item.estado_fase === "oferta_cierre" || item.estado_fase === "Cerrada" || item.estado_fase === "cerrada" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-white/5 text-[#879391] border border-white/10"
                        }`}>
                          {(item.estado_fase || "").replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-[#879391] font-mono">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {item.fecha_creacion 
                              ? new Date(item.fecha_creacion).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) 
                              : new Date(item.fecha_inicio_objetivo).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-2.5 py-1 bg-[#6bd8cb]/10 hover:bg-[#6bd8cb] text-[#6bd8cb] hover:text-[#101415] border border-[#6bd8cb]/20 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : searches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-xs text-[#879391]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderDot className="w-8 h-8 opacity-40" />
                        <span>No hay búsquedas registradas en el sistema.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#879391]">
                      Ninguna búsqueda coincide con los filtros especificados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table summary info */}
          <div className="bg-[#161a1b]/40 border-t border-white/5 px-6 py-4.5 flex items-center justify-between text-[11px] text-[#879391]">
            <div>
              Mostrando <span className="font-bold text-[#e0e3e5]">{filteredSearches.length}</span> de <span className="font-bold text-[#e0e3e5]">{searches.length}</span> búsquedas
            </div>
            <div>
              Plataforma de Reclutamiento de Talento
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
