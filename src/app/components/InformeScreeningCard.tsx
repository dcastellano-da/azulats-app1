'use client';

import React from "react";
import { 
  Sparkles, 
  FileText, 
  DollarSign, 
  Clock, 
  Building2, 
  AlertTriangle, 
  ShieldCheck, 
  CheckSquare, 
  Edit2, 
  RefreshCw,
  Compass,
  ArrowRight
} from "lucide-react";
import type { InformeEntrevistaIA } from "@/types/screening";

interface InformeScreeningCardProps {
  informe?: InformeEntrevistaIA | null;
  onEditClick?: () => void;
  onReanalyzeClick?: () => void;
}

export default function InformeScreeningCard({
  informe,
  onEditClick,
  onReanalyzeClick
}: InformeScreeningCardProps) {
  if (!informe || (!informe.experiencia_consolidada && !informe.pretension_economica_condiciones)) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-4 relative overflow-hidden">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Smart Scorecard — Entrevista de Screening</span>
              </h3>
              <p className="text-[10px] text-[#879391] mt-0.5">
                Síntesis automatizada por IA cruzando transcripción, CV y vacante
              </p>
            </div>
          </div>

          {onReanalyzeClick && (
            <button
              onClick={onReanalyzeClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6bd8cb] to-[#4eb8ab] text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:brightness-110"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analizar Transcripción</span>
            </button>
          )}
        </div>

        <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl space-y-2 bg-white/[0.01]">
          <FileText className="w-8 h-8 text-[#879391]/50 mx-auto" />
          <p className="text-xs text-[#c4c1fb] font-semibold">Sin informe de transcripción procesado.</p>
          <p className="text-[11px] text-[#879391] max-w-sm mx-auto">
            Sube el archivo de audio o la transcripción de la llamada de screening para generar el informe inteligente con Gemini 2.5 Flash.
          </p>
        </div>
      </div>
    );
  }

  // Desestructuración segura
  const expStr = typeof informe.experiencia_consolidada === "string"
    ? informe.experiencia_consolidada
    : (informe.experiencia_consolidada?.resumen_trayectoria || "Sin detalles de trayectoria.");

  const aligStr = typeof informe.alineacion_motivadores === "string"
    ? informe.alineacion_motivadores
    : (informe.alineacion_motivadores?.encaje_cultural || "Sin detalles de motivadores.");

  const pretension = informe.pretension_economica_condiciones || {};
  const auditoria = informe.auditoria_veracidad || {};
  const inconsistencias = auditoria.inconsistencias_detectadas || [];
  const fortalezas = auditoria.confirmaciones_fortalezas || [];
  const proximosPasos = informe.proximos_pasos || [];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-6 relative overflow-hidden bg-white/[0.02]">
      
      {/* Decorative ambient light */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#6bd8cb]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#6bd8cb]/20 to-[#c4c1fb]/20 border border-[#6bd8cb]/30 text-[#6bd8cb] shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Smart Scorecard — Entrevista de Screening
              </h3>
              <span className="text-[9px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded border border-[#6bd8cb]/20 uppercase font-bold">
                f2_evaluacion.informe_entrevista_ia
              </span>
            </div>
            {informe.fecha_analisis && (
              <p className="text-[10px] text-[#879391] font-mono mt-0.5">
                Generado: {new Date(informe.fecha_analisis).toLocaleString("es-ES")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-[#6bd8cb]/40 bg-white/5 hover:bg-[#6bd8cb]/10 text-white/90 hover:text-[#6bd8cb] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Revisar o corregir informe manualmente (Human-in-the-Loop)"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
              <span>Editar Informe</span>
            </button>
          )}
          {onReanalyzeClick && (
            <button
              onClick={onReanalyzeClick}
              className="px-3 py-1.5 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/15 hover:bg-[#6bd8cb] hover:text-stone-950 text-[#6bd8cb] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#6bd8cb]/10"
              title="Volver a procesar otra transcripción"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-analizar</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Experiencia Consolidada */}
        <div className="p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#6bd8cb] tracking-wider block flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#6bd8cb]" />
            Experiencia Consolidada
          </span>
          <p className="text-xs text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
            {expStr}
          </p>
        </div>

        {/* 2. Alineación y Motivadores */}
        <div className="p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#c4c1fb] tracking-wider block flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#c4c1fb]" />
            Alineación y Motivadores ("Qué está buscando")
          </span>
          <p className="text-xs text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
            {aligStr}
          </p>
        </div>

      </div>

      {/* 3. Pretensión Económica y Condiciones */}
      <div className="p-4 rounded-2xl border border-white/10 bg-stone-950/60 space-y-3">
        <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest block">
          Pretensión Económica y Condiciones de Trabajo
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#879391] block">Pretensión Salarial</span>
            <span className="font-bold text-[#6bd8cb] text-xs block">
              {pretension.pretension_salarial || "No especificada"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#879391] block">Disponibilidad</span>
            <span className="font-bold text-white text-xs block">
              {pretension.disponibilidad || "No especificada"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#879391] block">Modalidad Preferida</span>
            <span className="font-bold text-[#c4c1fb] text-xs block">
              {pretension.modalidad_preferida || "No especificada"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Auditoría de Veracidad */}
      {(inconsistencias.length > 0 || fortalezas.length > 0) && (
        <div className="p-4 rounded-2xl border border-white/10 bg-black/50 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Auditoría de Veracidad (Cruce Transcripción vs CV)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Inconsistencias */}
            {inconsistencias.length > 0 && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-rose-400 block flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Inconsistencias Detectadas
                </span>
                <ul className="space-y-1.5 list-disc pl-4 text-rose-200 leading-relaxed text-[11px]">
                  {inconsistencias.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirmaciones y Fortalezas */}
            {fortalezas.length > 0 && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Confirmaciones / Fortalezas Validadas
                </span>
                <ul className="space-y-1.5 list-disc pl-4 text-emerald-200 leading-relaxed text-[11px]">
                  {fortalezas.map((fort, i) => (
                    <li key={i}>{fort}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Próximos Pasos (Action Items) */}
      {proximosPasos.length > 0 && (
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#6bd8cb] tracking-wider block flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#6bd8cb]" />
            Próximos Pasos (Action Items de Cierre de Entrevista)
          </span>
          <div className="space-y-1.5">
            {proximosPasos.map((paso, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 text-xs text-white font-medium">
                <span className="w-5 h-5 rounded-lg bg-[#6bd8cb]/20 text-[#6bd8cb] flex items-center justify-center text-[10px] font-bold shrink-0 font-mono">
                  {idx + 1}
                </span>
                <span>{paso}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
