'use client';

import React, { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Sparkles, 
  Brain, 
  DollarSign, 
  UserCheck, 
  BookOpen, 
  Briefcase, 
  EyeOff, 
  Download, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Building2
} from "lucide-react";

import { FichaPdfOpciones, PasosProgresoFichaPdf } from "@/types/fichaPdf";
import { generarFichaPdfAction } from "@/actions/pipeline";

interface GenerarFichaPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  candidateName?: string;
  roleName?: string;
}

const DEFAULT_OPTIONS: FichaPdfOpciones = {
  incluir_resumen_ia: true,
  incluir_test_personalidad: true,
  incluir_pretension_salarial: true,
  incluir_notas_assessment: true,
  incluir_bitacora: true,
  incluir_trayectoria: true,
  anonimizar_candidato: false
};

const LOCAL_STORAGE_KEY = "ats_ficha_pdf_preferences";

export default function GenerarFichaPdfModal({
  isOpen,
  onClose,
  pipelineId,
  candidateName = "Candidato",
  roleName = "Perfil Tech"
}: GenerarFichaPdfModalProps) {
  const [opciones, setOpciones] = useState<FichaPdfOpciones>(DEFAULT_OPTIONS);
  const [paso, setPaso] = useState<PasosProgresoFichaPdf>("idle");
  const [pasoIndice, setPasoIndice] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved preferences from localStorage on mount/open
  useEffect(() => {
    if (isOpen) {
      setPaso("idle");
      setPasoIndice(0);
      setErrorMessage(null);
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setOpciones(prev => ({ ...prev, ...parsed }));
        }
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof FichaPdfOpciones) => {
    setOpciones(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const sanitizeFilenameComponent = (str: string) => {
    return str
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, "_")
      .replace(/_+/g, "_");
  };

  const handleGenerar = async () => {
    setPaso("recopilando");
    setPasoIndice(1);
    setErrorMessage(null);

    // Dynamic Step Animation Sequence ("Efecto Wow")
    const stepTimer1 = setTimeout(() => {
      setPaso("redactando_ia");
      setPasoIndice(2);
    }, 700);

    const stepTimer2 = setTimeout(() => {
      setPaso("renderizando_pdf");
      setPasoIndice(3);
    }, 1500);

    try {
      const res = await generarFichaPdfAction(pipelineId, opciones);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.success && res.data) {
        setPaso("completado");
        setPasoIndice(4);

        // Native Safe Conversion (Base64 -> Blob) via Browser Fetch Engine
        const base64Clean = res.data.replace(/^data:application\/pdf;base64,/, "").trim();
        console.log('[DEBUG CLIENTE] Longitud de Base64 recibida:', base64Clean.length);
        console.log('[DEBUG CLIENTE] Cabecera Base64 recibida:', base64Clean.substring(0, 20));
        const dataUri = `data:application/pdf;base64,${base64Clean}`;
        const fetchResponse = await fetch(dataUri);
        const blob = await fetchResponse.blob();
        console.log('[DEBUG CLIENTE] Tamaño final del Blob generado:', blob.size, 'bytes');

        // Trigger transparent download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const safeCandName = opciones.anonimizar_candidato
          ? "Anonimo"
          : sanitizeFilenameComponent(candidateName);
        const safeRoleName = sanitizeFilenameComponent(roleName);
        a.download = `Ficha_Tecnica_${safeCandName}_${safeRoleName}.pdf`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Auto close after 2.5 seconds on success
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setPaso("error");
        setErrorMessage(res.message || "No se pudo generar la Ficha PDF en el servidor.");
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setPaso("error");
      setErrorMessage(err.message || "Error inesperado al solicitar la generación de la Ficha PDF.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-white/10 bg-[#15191c] text-white shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 flex items-center justify-center text-[#6bd8cb]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Ficha Técnica de Presentación (PDF)
              </h3>
              <p className="text-xs text-[#879391]">
                {candidateName} • {roleName}
              </p>
            </div>
          </div>
          {paso !== "recopilando" && paso !== "redactando_ia" && paso !== "renderizando_pdf" && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Form View (Idle or Error) */}
          {(paso === "idle" || paso === "error") && (
            <div className="space-y-5">
              
              {/* Institutional Branding Indicator (P-CFG-01) */}
              <div className="p-3.5 rounded-2xl bg-[#6bd8cb]/5 border border-[#6bd8cb]/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#6bd8cb]">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Branding de Agencia (P-CFG-01)</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#879391] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  Powered by Azul ATS
                </span>
              </div>

              {/* Error notification if failed */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Error en la generación</p>
                    <p className="text-[#879391]">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Parameters Checkboxes List */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#879391] uppercase tracking-wider block">
                  Selecciona los bloques a incluir en la Ficha Técnica:
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Resumen IA */}
                  <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    opciones.incluir_resumen_ia 
                      ? "bg-[#6bd8cb]/10 border-[#6bd8cb]/40 text-white" 
                      : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={opciones.incluir_resumen_ia ?? true}
                      onChange={() => handleToggle("incluir_resumen_ia")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      opciones.incluir_resumen_ia ? "border-[#6bd8cb] bg-[#6bd8cb] text-black" : "border-white/20"
                    }`}>
                      {opciones.incluir_resumen_ia && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb]" /> Resumen IA
                      </span>
                      <p className="text-[11px] text-[#879391]">Síntesis ejecutiva redactada al vuelo.</p>
                    </div>
                  </label>

                  {/* Test Personalidad */}
                  <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    opciones.incluir_test_personalidad 
                      ? "bg-[#9b5de5]/10 border-[#9b5de5]/40 text-white" 
                      : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={opciones.incluir_test_personalidad ?? true}
                      onChange={() => handleToggle("incluir_test_personalidad")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      opciones.incluir_test_personalidad ? "border-[#9b5de5] bg-[#9b5de5] text-black" : "border-white/20"
                    }`}>
                      {opciones.incluir_test_personalidad && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-[#c4c1fb]" /> Test Personalidad (CFV)
                      </span>
                      <p className="text-[11px] text-[#879391]">Dimensiones y arquetipo cultural.</p>
                    </div>
                  </label>

                  {/* Pretension Salarial */}
                  <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    opciones.incluir_pretension_salarial 
                      ? "bg-amber-500/10 border-amber-500/40 text-white" 
                      : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={opciones.incluir_pretension_salarial ?? true}
                      onChange={() => handleToggle("incluir_pretension_salarial")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      opciones.incluir_pretension_salarial ? "border-amber-400 bg-amber-400 text-black" : "border-white/20"
                    }`}>
                      {opciones.incluir_pretension_salarial && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Pretensión Salarial
                      </span>
                      <p className="text-[11px] text-[#879391]">Expectativas y modalidad de trabajo.</p>
                    </div>
                  </label>

                  {/* Assessment Manual */}
                  <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    opciones.incluir_notas_assessment 
                      ? "bg-emerald-500/10 border-emerald-500/40 text-white" 
                      : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={opciones.incluir_notas_assessment ?? true}
                      onChange={() => handleToggle("incluir_notas_assessment")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      opciones.incluir_notas_assessment ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/20"
                    }`}>
                      {opciones.incluir_notas_assessment && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Assessment Manual
                      </span>
                      <p className="text-[11px] text-[#879391]">Aspectos destacados por el reclutador.</p>
                    </div>
                  </label>

                  {/* Bitácora de Reclutamiento */}
                  <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    opciones.incluir_bitacora 
                      ? "bg-blue-500/10 border-blue-500/40 text-white" 
                      : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={opciones.incluir_bitacora ?? true}
                      onChange={() => handleToggle("incluir_bitacora")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      opciones.incluir_bitacora ? "border-blue-400 bg-blue-400 text-black" : "border-white/20"
                    }`}>
                      {opciones.incluir_bitacora && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Bitácora Reclutador
                      </span>
                      <p className="text-[11px] text-[#879391]">Notas cronológicas de F1 y F2.</p>
                    </div>
                  </label>

                  {/* Trayectoria CV */}
                  <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    opciones.incluir_trayectoria 
                      ? "bg-indigo-500/10 border-indigo-500/40 text-white" 
                      : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={opciones.incluir_trayectoria ?? true}
                      onChange={() => handleToggle("incluir_trayectoria")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      opciones.incluir_trayectoria ? "border-indigo-400 bg-indigo-400 text-black" : "border-white/20"
                    }`}>
                      {opciones.incluir_trayectoria && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Trayectoria Laboral
                      </span>
                      <p className="text-[11px] text-[#879391]">Detalle cronológico del CV.</p>
                    </div>
                  </label>

                </div>
              </div>

              {/* Modo Ciego / Anonimizado Switch */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Anonimizar Candidato (Modo Ciego)</span>
                    <span className="text-[11px] text-[#879391]">Oculta foto, nombre, teléfono y correo para selección sin sesgos.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={opciones.anonimizar_candidato ?? false}
                  onChange={() => handleToggle("anonimizar_candidato")}
                  className="w-5 h-5 accent-[#6bd8cb] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGenerar}
                  className="px-5 py-2.5 rounded-xl bg-[#6bd8cb] hover:bg-[#5bc4b7] text-stone-950 text-xs font-bold transition-all shadow-lg shadow-[#6bd8cb]/20 cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Generar y Descargar PDF</span>
                </button>
              </div>

            </div>
          )}

          {/* Sequential Animated Progress View ("Efecto Wow") */}
          {(paso === "recopilando" || paso === "redactando_ia" || paso === "renderizando_pdf" || paso === "completado") && (
            <div className="py-6 space-y-6 text-center">
              
              <div className="relative flex items-center justify-center">
                {paso !== "completado" ? (
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-[#6bd8cb]/20 border-t-[#6bd8cb] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[#6bd8cb]">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-in zoom-in-75 duration-300">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">
                  {paso === "recopilando" && "Recopilando datos y preferencias..."}
                  {paso === "redactando_ia" && "Redactando resumen ejecutivo con IA..."}
                  {paso === "renderizando_pdf" && "Ensamblando diseño y renderizando documento..."}
                  {paso === "completado" && "¡Descarga Completada!"}
                </h4>
                <p className="text-xs text-[#879391]">
                  {paso !== "completado" 
                    ? "Generando documento técnico optimizado para el cliente..."
                    : "El archivo PDF ha sido guardado en tu equipo sin recargar la página."
                  }
                </p>
              </div>

              {/* Sequential Stepper Lights */}
              <div className="max-w-md mx-auto space-y-3 pt-2">
                
                {/* Paso 1 */}
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  pasoIndice >= 1 
                    ? "bg-[#6bd8cb]/10 border-[#6bd8cb]/30 text-[#6bd8cb]" 
                    : "bg-white/5 border-white/5 text-[#879391]"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    pasoIndice >= 1 ? "bg-[#6bd8cb] text-black" : "bg-white/10 text-white/50"
                  }`}>1</div>
                  <span className="font-semibold">Recopilando datos del candidato y vacante...</span>
                </div>

                {/* Paso 2 */}
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  pasoIndice >= 2 
                    ? "bg-[#6bd8cb]/10 border-[#6bd8cb]/30 text-[#6bd8cb]" 
                    : "bg-white/5 border-white/5 text-[#879391]"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    pasoIndice >= 2 ? "bg-[#6bd8cb] text-black" : "bg-white/10 text-white/50"
                  }`}>2</div>
                  <span className="font-semibold">Redactando resumen ejecutivo con IA (Gemini)...</span>
                </div>

                {/* Paso 3 */}
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  pasoIndice >= 3 
                    ? "bg-[#6bd8cb]/10 border-[#6bd8cb]/30 text-[#6bd8cb]" 
                    : "bg-white/5 border-white/5 text-[#879391]"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    pasoIndice >= 3 ? "bg-[#6bd8cb] text-black" : "bg-white/10 text-white/50"
                  }`}>3</div>
                  <span className="font-semibold">Ensamblando diseño con branding institucional (P-CFG-01)...</span>
                </div>

                {/* Paso 4 */}
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  pasoIndice >= 4 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-white/5 border-white/5 text-[#879391]"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    pasoIndice >= 4 ? "bg-emerald-400 text-black" : "bg-white/10 text-white/50"
                  }`}>4</div>
                  <span className="font-semibold">Descarga directa completada.</span>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
