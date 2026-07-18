'use client';

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Contact, 
  Search,
  Plus, 
  ExternalLink, 
  FileText, 
  Mail, 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  AlertCircle,
  Clock,
  Filter,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Inbox,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import SlideOver from "../components/SlideOver";
import CandidatoForm from "../components/CandidatoForm";
import { getCandidatosAPI, actualizarCandidatoAPI, Candidato } from "@/actions/candidatos";

export default function TalentoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // States
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("Todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Slide Over state
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  
  // Transitions
  const [isPending, startTransition] = useTransition();
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Client-side authentication protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load candidates on mount
  useEffect(() => {
    if (user) {
      loadCandidatos();
    }
  }, [user]);

  const loadCandidatos = async () => {
    setLoadingCandidatos(true);
    setErrorFeedback(null);
    try {
      const response = await getCandidatosAPI();
      if (response.success && response.data) {
        setCandidatos(response.data);
      } else {
        setErrorFeedback(response.message || "Error al cargar el listado de candidatos.");
      }
    } catch (err) {
      setErrorFeedback("Error de comunicación de red con el cluster Next.js.");
    } finally {
      setLoadingCandidatos(false);
    }
  };

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

  // Handle fast status change (interactive faders simulation)
  const handleUpdateStatus = (id: string, newStatus: Candidato["estado_revision"]) => {
    // Optimistic Update
    const originalList = [...candidatos];
    setCandidatos(prev => 
      prev.map(cand => cand.id === id ? { ...cand, estado_revision: newStatus } : cand)
    );

    startTransition(async () => {
      try {
        const response = await actualizarCandidatoAPI(id, { estado_revision: newStatus });
        if (!response.success) {
          // Revert on error
          setCandidatos(originalList);
          alert(`No se pudo actualizar el estado: ${response.message}`);
        }
      } catch (err) {
        setCandidatos(originalList);
        alert("Falla de red al intentar actualizar el estado del candidato.");
      }
    });
  };

  const handleViewCv = (candId: string, urlCv: string) => {
    if (!urlCv) return;
    if (urlCv.startsWith("gs://")) {
      const match = document.cookie.match(/(^| )azul_ats_token=([^;]+)/);
      const token = match ? match[2] : "";
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const downloadUrl = `${apiBaseUrl}/api/v1/candidatos/${candId}/cv?token=${token}`;
      window.open(downloadUrl, "_blank");
    } else {
      window.open(urlCv, "_blank");
    }
  };

  const handleCopyCandidateData = (c: Candidato) => {
    const formattedDate = new Date(c.createdAt).toLocaleDateString("es-ES", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const textToCopy = `POSTULANTE: ${c.nombre_completo}
Puesto al que postula: ${c.puesto || 'No especificado'}
Email: ${c.email}
LinkedIn: ${c.linkedin_url || 'No proporcionado'}
Estado de Revisión: ${c.estado_revision}
Origen: ${c.origen}
Fecha de Registro: ${formattedDate}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedId(c.id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles:", err);
      });
  };

  // Callback on successful candidate addition
  const handleCreateSuccess = (nuevoCandidato: Candidato) => {
    setIsSlideOpen(false);
    // Reload candidate list to verify ordering (newest first)
    loadCandidatos();
  };

  // Filter candidates list
  const filteredCandidatos = candidatos.filter(c => {
    const matchesSearch = 
      c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = 
      selectedEstado === "Todos" || c.estado_revision === selectedEstado;

    return matchesSearch && matchesEstado;
  });

  const getStatusBubbleStyle = (status: Candidato["estado_revision"]) => {
    switch (status) {
      case "Pendiente":
        return "bg-amber-500 shadow-amber-500/50";
      case "Revisado":
        return "bg-indigo-400 shadow-indigo-400/50";
      case "Seleccionado":
        return "bg-emerald-400 shadow-emerald-400/50";
      case "Descartado":
        return "bg-rose-500 shadow-rose-500/50";
      default:
        return "bg-gray-400 shadow-gray-400/50";
    }
  };

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Background ambient radial blurs consistent with Stitch */}
      <div className="ambient-blur-1 top-20 left-20 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-32 right-32 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Banner Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-[#0d9488]/20">
              <Contact className="w-6 h-6 text-[#101415]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Maestro de Postulantes
                </span>
                <span className="text-[10px] font-bold text-white/40">Fase 2: Postulantes</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                Postulantes & Candidatos
              </h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Quick links to alternate views */}
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
              <span>Búsquedas</span>
            </Link>

            <Link
              href="/reclutamiento"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-amber-400 hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Reclutamiento</span>
            </Link>

            <Link
              href="/configuracion"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#c4c1fb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </Link>

            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block"></div>

            <button
              onClick={() => setIsSlideOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 hover:glow-btn transition-all shadow-md shadow-[#0d9488]/15 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Nuevo Postulante</span>
            </button>
          </div>
        </header>

        {/* Filters control pane */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#879391]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar candidato por nombre, rol o email..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:ring-1 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all"
            />
          </div>

          {/* Filter tabs container with Help Tooltip */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-1.5 p-1 bg-[#101415] border border-white/10 rounded-xl overflow-x-auto w-full md:w-auto">
              {["Todos", "Pendiente", "Revisado", "Seleccionado", "Descartado"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setSelectedEstado(estado)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedEstado === estado 
                      ? "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20" 
                      : "text-[#879391] hover:text-white border border-transparent"
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>

            {/* Help Tooltip */}
            <div className="relative group flex items-center shrink-0">
              <button 
                type="button" 
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6bd8cb]/30 focus:border-[#6bd8cb]/30"
                aria-label="Ayuda sobre estados"
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>
              
              {/* Tooltip Popup container */}
              <div className="absolute right-0 bottom-full mb-2 w-72 p-3.5 bg-[#161b1d] border border-white/15 rounded-xl text-[11px] leading-relaxed text-[#c4c1fb] shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-50">
                Los estados de los postulantes son solo informativos y corresponden a conceptos generales, no a su participación como candidatos en las diferentes búsquedas.
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Grid Loader & Container */}
        {loadingCandidatos ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-[#879391] font-semibold">Cargando la base de talentos...</p>
          </div>
        ) : errorFeedback ? (
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm font-semibold text-red-200">{errorFeedback}</p>
            <button
              onClick={loadCandidatos}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-red-400/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              Reintentar Carga
            </button>
          </div>
        ) : filteredCandidatos.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/10 bg-white/[0.01] backdrop-blur-md text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/15 flex items-center justify-center text-[#879391]">
              <Inbox className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">No se encontraron candidatos</h3>
              <p className="text-xs text-[#879391] max-w-sm mt-1 mx-auto leading-relaxed">
                Ninguna postulación coincide con los filtros aplicados. Registre manualmente un postulante o limpie la búsqueda.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCandidatos.map((cand) => (
              <div
                key={cand.id}
                className="group relative rounded-3xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.04] p-5 flex flex-col justify-between transition-all duration-300 hover:glow-effect hover:-translate-y-1 block text-left"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#6bd8cb]/20 to-transparent group-hover:via-[#6bd8cb]/50 transition-all"></div>
                
                <div className="space-y-4.5">
                  {/* Card Header: name and State sphere */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[80%]">
                      <h3 className="text-sm font-extrabold text-white group-hover:text-[#6bd8cb] transition-colors leading-tight">
                        {cand.nombre_completo}
                      </h3>
                    </div>

                    {/* Sphere status */}
                    <div 
                      className={`w-3.5 h-3.5 rounded-full ${getStatusBubbleStyle(cand.estado_revision)} shadow-md animate-pulse`} 
                      title={`Estado: ${cand.estado_revision}`}
                    />
                  </div>

                  {/* Body Content */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold block mb-1">
                        Puesto Postulado
                      </span>
                      <p className="text-xs font-bold text-[#c4c1fb] truncate">
                        {cand.puesto}
                      </p>
                    </div>

                    <div className="space-y-1.5 font-medium text-left">
                      <a
                        href={`mailto:${cand.email}`}
                        className="flex items-center gap-2 text-[11px] text-[#879391] hover:text-[#6bd8cb] transition-colors cursor-pointer hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cand.email}</span>
                      </a>
                      
                      {cand.linkedin_url && (
                        <a
                          href={cand.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[11px] text-[#6bd8cb] hover:underline"
                        >
                          <span className="w-3.5 h-3.5 font-mono text-[9px] font-bold border border-[#6bd8cb]/30 rounded flex items-center justify-center bg-[#6bd8cb]/5">in</span>
                          <span className="truncate">Ver Perfil LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions & Status selectors */}
                <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
                  {/* Fast Interactive Status Mutation (DAW knobs/slider simulator) */}
                  <div>
                    <label className="text-[9px] text-[#879391] uppercase tracking-wider font-bold block mb-2">
                      Fader Estado (Mutar)
                    </label>
                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#101415] border border-white/5 rounded-lg">
                      {(["Pendiente", "Revisado", "Seleccionado", "Descartado"] as const).map((est) => (
                        <button
                          key={est}
                          onClick={() => handleUpdateStatus(cand.id, est)}
                          title={`Fase: ${est}`}
                          className={`py-1 rounded text-[8px] font-bold transition-all cursor-pointer ${
                            cand.estado_revision === est
                              ? est === "Pendiente" 
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : est === "Revisado"
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : est === "Seleccionado"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "text-white/20 hover:text-white/60 border border-transparent"
                          }`}
                        >
                          {est.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* View Details Link (opens DAW faders detail dashboard) */}
                    <Link
                      href={`/talento/${cand.id}`}
                      className="flex-grow flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <span>Detalles</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* PDF CV Direct View button */}
                    <button
                      onClick={() => handleViewCv(cand.id, cand.url_cv)}
                      title="Ver Documento CV PDF"
                      className="px-3 py-2 rounded-xl text-[#6bd8cb] bg-white/5 border border-white/10 hover:bg-[#6bd8cb]/10 hover:border-[#6bd8cb]/30 transition-all cursor-pointer flex items-center justify-center font-bold"
                    >
                      <FileText className="w-4.5 h-4.5" />
                    </button>

                    {/* Copy Candidate Info button */}
                    <button
                      onClick={() => handleCopyCandidateData(cand)}
                      title="Copiar datos del postulante"
                      className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        copiedId === cand.id 
                          ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/30" 
                          : "text-[#c4c1fb] bg-white/5 border-white/10 hover:bg-[#c4c1fb]/10 hover:border-[#c4c1fb]/30"
                      }`}
                    >
                      {copiedId === cand.id 
                        ? <Check className="w-4.5 h-4.5" /> 
                        : <Copy className="w-4.5 h-4.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over controller for registration */}
      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title="Alta de Postulante"
        isSubmitting={isSubmittingForm}
        formId="candidate-form"
        submitLabel="Registrar Postulante"
      >
        <CandidatoForm
          onSuccess={handleCreateSuccess}
          onClose={() => setIsSlideOpen(false)}
          onSubmittingChange={(submitting) => setIsSubmittingForm(submitting)}
        />
      </SlideOver>
    </div>
  );
}
