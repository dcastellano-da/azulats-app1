'use client';

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Sliders, 
  ArrowLeft, 
  Mail, 
  FileText, 
  AlertCircle, 
  Calendar, 
  ExternalLink,
  Trash2,
  CheckCircle2,
  Sparkles,
  Info,
  Maximize2,
  Copy,
  Check
} from "lucide-react";
import { getCandidatosAPI, actualizarCandidatoAPI, Candidato } from "@/actions/candidatos";

export default function CandidatoDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user, loading: authLoading } = useAuth();

  // Candidate state
  const [cand, setCand] = useState<Candidato | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Candidato["estado_revision"]>("Pendiente");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // DAW faders simulated scores
  const [hardSkills, setHardSkills] = useState(85);
  const [softSkills, setSoftSkills] = useState(78);
  const [culturalFit, setCulturalFit] = useState(90);
  const [seniority, setSeniority] = useState(65);

  // Client-side authentication protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load candidate info
  useEffect(() => {
    if (user && id) {
      loadCandidato();
    }
  }, [user, id]);

  const loadCandidato = async () => {
    setLoading(true);
    try {
      const response = await getCandidatosAPI();
      if (response.success && response.data) {
        const found = response.data.find((c: Candidato) => c.id === id);
        if (found) {
          setCand(found);
          setStatus(found.estado_revision);
          
          // Seed deterministic fader values based on ID length or values to simulate different candidates
          const multiplier = found.nombre_completo.length || 10;
          setHardSkills((multiplier * 7) % 35 + 65); // 65-100 range
          setSoftSkills((multiplier * 9) % 30 + 70); // 70-100 range
          setCulturalFit((multiplier * 3) % 25 + 75); // 75-100 range
          setSeniority((multiplier * 11) % 40 + 55); // 55-95 range
        } else {
          setFeedback({
            type: "error",
            message: "Candidato no encontrado en el sistema."
          });
        }
      } else {
        setFeedback({
          type: "error",
          message: response.message || "Error al obtener datos."
        });
      }
    } catch (_) {
      setFeedback({
        type: "error",
        message: "Error de conexión con el Servidor Next.js."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: Candidato["estado_revision"]) => {
    setStatus(newStatus);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await actualizarCandidatoAPI(id, { estado_revision: newStatus });
        if (response.success) {
          setFeedback({
            type: "success",
            message: `Estado de revisión actualizado a '${newStatus}' con éxito.`
          });
        } else {
          setFeedback({
            type: "error",
            message: response.message || "No se pudo actualizar el estado de revisión."
          });
          // Rollback to original value
          if (cand) setStatus(cand.estado_revision);
        }
      } catch (_) {
        setFeedback({
          type: "error",
          message: "Error de red al actualizar estado."
        });
        if (cand) setStatus(cand.estado_revision);
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

  const handleCopyCandidateData = () => {
    if (!cand) return;
    const formattedDate = new Date(cand.createdAt).toLocaleDateString("es-ES", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const textToCopy = `POSTULANTE: ${cand.nombre_completo}
Puesto al que postula: ${cand.puesto || 'No especificado'}
Email: ${cand.email}
LinkedIn: ${cand.linkedin_url || 'No proporcionado'}
Estado de Revisión: ${cand.estado_revision}
Origen: ${cand.origen}
Fecha de Registro: ${formattedDate}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles:", err);
      });
  };

  const handleSoftDelete = () => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado a Descartado? (Soft Delete)")) {
      handleStatusChange("Descartado");
    }
  };

  if (authLoading || (loading && !feedback)) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusBubbleClass = (curStatus: Candidato["estado_revision"]) => {
    switch (curStatus) {
      case "Pendiente":
        return "bg-amber-500 shadow-amber-500/60";
      case "Revisado":
        return "bg-indigo-400 shadow-indigo-400/60";
      case "Seleccionado":
        return "bg-emerald-400 shadow-emerald-400/60";
      case "Descartado":
        return "bg-rose-500 shadow-rose-500/60";
      default:
        return "bg-gray-400 shadow-gray-400/60";
    }
  };

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Background blurs */}
      <div className="ambient-blur-1 top-10 left-10 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-10 right-10 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation header */}
        <header className="flex justify-between items-center pb-5 border-b border-white/10">
          <Link
            href="/talento"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#c4c1fb] hover:bg-white/10 hover:text-white transition-all cursor-pointer font-bold"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            <span>Volver a Postulantes</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#879391]">ID: {id}</span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              DAW Console Active
            </span>
          </div>
        </header>

        {feedback && (
          <div
            className={`flex gap-3 p-4 rounded-xl border text-xs max-w-4xl mx-auto text-left font-medium leading-relaxed transition-all ${
              feedback.type === "success"
                ? "border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-[#6bd8cb]"
                : "border-red-500/20 bg-red-500/5 text-red-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {!cand ? (
          <div className="max-w-md mx-auto text-center py-20 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">El candidato no existe</h2>
            <p className="text-xs text-[#879391]">
              La ficha de este candidato no pudo ser localizada o fue borrada físicamente (Hard Delete).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
            
            {/* LEFT PANEL: Classical profile info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md space-y-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#6bd8cb]/5 to-transparent pointer-none"></div>

                {/* Profile Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#879391] font-mono tracking-widest uppercase">Postulante Espontáneo</span>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{cand.nombre_completo}</h2>
                    <p className="text-sm font-semibold text-[#c4c1fb]">{cand.puesto}</p>
                  </div>
                  
                  {/* Glowing dynamic status sphere */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-4 h-4 rounded-full ${getStatusBubbleClass(status)} animate-pulse shadow-lg`}></div>
                    <span className="text-[8px] font-mono text-white/50">{status}</span>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="space-y-4.5 text-xs text-[#879391] pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Correo Electrónico</p>
                      <a href={`mailto:${cand.email}`} className="text-white hover:underline font-medium">{cand.email}</a>
                    </div>
                  </div>

                  {cand.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#6bd8cb]/20 flex items-center justify-center text-[#6bd8cb] font-bold text-xs">
                        in
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Perfil Laboral</p>
                        <a 
                          href={cand.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#6bd8cb] hover:underline font-medium flex items-center gap-1"
                        >
                          <span>Ver LinkedIn</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Fecha de Registro</p>
                      <p className="text-white font-medium">{new Date(cand.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70 font-mono text-[9px] font-bold">
                      ORG
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Origen del Perfil</p>
                      <p className="text-white font-medium">{cand.origen}</p>
                    </div>
                  </div>
                </div>

                {/* Edit status dropdown */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase block text-left">
                    Estado de Revisión (Cambiar)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as Candidato["estado_revision"])}
                    disabled={isPending}
                    className="w-full bg-[#101415] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-1 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Revisado">Revisado</option>
                    <option value="Seleccionado">Seleccionado</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

                {/* Control Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => cand && handleViewCv(cand.id, cand.url_cv)}
                    className="flex-grow flex items-center justify-center gap-2 px-4.5 py-3 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver CV Adjunto</span>
                  </button>

                  <button
                    onClick={handleCopyCandidateData}
                    title="Copiar datos del postulante"
                    className={`px-3 py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                      copied 
                        ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/30" 
                        : "text-[#c4c1fb] bg-white/5 border-white/10 hover:bg-[#c4c1fb]/10 hover:border-[#c4c1fb]/30"
                    }`}
                  >
                    {copied 
                      ? <Check className="w-4.5 h-4.5" /> 
                      : <Copy className="w-4.5 h-4.5" />
                    }
                  </button>

                  <button
                    onClick={handleSoftDelete}
                    disabled={isPending || status === "Descartado"}
                    className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Descartar postulante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: DAW Console Equalizer Faders */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Professional Summary Section (Future development placeholder) */}
              <div className="p-6 rounded-3xl border border-white/10 bg-[#16191b] backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 text-[#6bd8cb] border-b border-white/10 pb-3">
                  <FileText className="w-4 h-4" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest font-sans">
                    Resumen Profesional
                  </h3>
                </div>
                <p className="text-xs text-[#879391] font-medium leading-relaxed italic select-none">
                  A desarrollar
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-white/10 bg-[#16191b] backdrop-blur-md space-y-6">
                
                {/* Console Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-[#6bd8cb]">
                    <Sliders className="w-4.5 h-4.5" />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest font-sans">
                      IA Analysis Equalizer Console
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-[#879391]">
                    <Sparkles className="w-3.5 h-3.5 text-[#c4c1fb]" />
                    <span>Score Calculado</span>
                  </div>
                </div>

                {/* Faders channels */}
                <div className="grid grid-cols-4 gap-4 md:gap-6 pt-2 select-none h-80">
                  
                  {/* CHANNEL 1: Hard Skills */}
                  <div className="flex flex-col items-center justify-between h-full bg-[#101415]/60 border border-white/5 rounded-2xl py-4 px-2">
                    <span className="text-[10px] font-bold text-white/50">{hardSkills}%</span>
                    
                    {/* Vertical fader range tracks */}
                    <div className="relative w-8 h-48 bg-black/80 rounded-full border border-white/10 flex items-center justify-center">
                      <div 
                        className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-[#0d9488]/80 to-[#6bd8cb]/80"
                        style={{ height: `${hardSkills}%` }}
                      ></div>
                      
                      {/* Heavy knob handle */}
                      <div 
                        className="absolute w-8 h-5 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rounded border border-gray-600 shadow-md cursor-pointer flex flex-col justify-between py-1"
                        style={{ bottom: `calc(${hardSkills}% - 10px)` }}
                      >
                        <div className="w-full h-[1px] bg-black"></div>
                        <div className="w-full h-[2px] bg-red-500"></div>
                        <div className="w-full h-[1px] bg-black"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-white tracking-wider leading-tight">Hard</p>
                      <p className="text-[8px] text-[#879391] uppercase">Skills</p>
                    </div>
                  </div>

                  {/* CHANNEL 2: Soft Skills */}
                  <div className="flex flex-col items-center justify-between h-full bg-[#101415]/60 border border-white/5 rounded-2xl py-4 px-2">
                    <span className="text-[10px] font-bold text-white/50">{softSkills}%</span>
                    
                    {/* Vertical fader range tracks */}
                    <div className="relative w-8 h-48 bg-black/80 rounded-full border border-white/10 flex items-center justify-center">
                      <div 
                        className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-indigo-500/80 to-[#c4c1fb]/80"
                        style={{ height: `${softSkills}%` }}
                      ></div>
                      
                      {/* Heavy knob handle */}
                      <div 
                        className="absolute w-8 h-5 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rounded border border-gray-600 shadow-md cursor-pointer flex flex-col justify-between py-1"
                        style={{ bottom: `calc(${softSkills}% - 10px)` }}
                      >
                        <div className="w-full h-[1px] bg-black"></div>
                        <div className="w-full h-[2px] bg-indigo-500"></div>
                        <div className="w-full h-[1px] bg-black"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-white tracking-wider leading-tight">Soft</p>
                      <p className="text-[8px] text-[#879391] uppercase">Skills</p>
                    </div>
                  </div>

                  {/* CHANNEL 3: Cultural Fit */}
                  <div className="flex flex-col items-center justify-between h-full bg-[#101415]/60 border border-white/5 rounded-2xl py-4 px-2">
                    <span className="text-[10px] font-bold text-white/50">{culturalFit}%</span>
                    
                    {/* Vertical fader range tracks */}
                    <div className="relative w-8 h-48 bg-black/80 rounded-full border border-white/10 flex items-center justify-center">
                      <div 
                        className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-amber-500/80 to-amber-300/80"
                        style={{ height: `${culturalFit}%` }}
                      ></div>
                      
                      {/* Heavy knob handle */}
                      <div 
                        className="absolute w-8 h-5 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rounded border border-gray-600 shadow-md cursor-pointer flex flex-col justify-between py-1"
                        style={{ bottom: `calc(${culturalFit}% - 10px)` }}
                      >
                        <div className="w-full h-[1px] bg-black"></div>
                        <div className="w-full h-[2px] bg-amber-500"></div>
                        <div className="w-full h-[1px] bg-black"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-white tracking-wider leading-tight">Cultural</p>
                      <p className="text-[8px] text-[#879391] uppercase">Fit</p>
                    </div>
                  </div>

                  {/* CHANNEL 4: Seniority Index */}
                  <div className="flex flex-col items-center justify-between h-full bg-[#101415]/60 border border-white/5 rounded-2xl py-4 px-2">
                    <span className="text-[10px] font-bold text-white/50">{seniority}%</span>
                    
                    {/* Vertical fader range tracks */}
                    <div className="relative w-8 h-48 bg-black/80 rounded-full border border-white/10 flex items-center justify-center">
                      <div 
                        className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-rose-500/80 to-rose-300/80"
                        style={{ height: `${seniority}%` }}
                      ></div>
                      
                      {/* Heavy knob handle */}
                      <div 
                        className="absolute w-8 h-5 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rounded border border-gray-600 shadow-md cursor-pointer flex flex-col justify-between py-1"
                        style={{ bottom: `calc(${seniority}% - 10px)` }}
                      >
                        <div className="w-full h-[1px] bg-black"></div>
                        <div className="w-full h-[2px] bg-rose-500"></div>
                        <div className="w-full h-[1px] bg-black"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-white tracking-wider leading-tight">Seniority</p>
                      <p className="text-[8px] text-[#879391] uppercase">Index</p>
                    </div>
                  </div>

                </div>

                {/* Console Metadata controls */}
                <div className="flex gap-2.5 p-3.5 rounded-xl border border-white/5 bg-black/40 text-left text-neutral-400 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 text-[#6bd8cb] mt-0.5" />
                  <p>
                    Consola ecualizadora inteligente simulada por canal MIDI. Estos faders representan las calificaciones de la inteligencia artificial de Azul ATS computando semanticamente las secciones de educación, experiencia laboral previa y adecuación al fit cultural de la compañía.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
