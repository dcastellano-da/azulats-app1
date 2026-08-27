'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Edit2, 
  Save, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { actualizarAssessmentManualAction } from '@/actions/pipeline';
import type { AssessmentManual } from '@/types/screening';

interface AssessmentManualCardProps {
  pipelineId?: string;
  assessmentManual?: AssessmentManual | null;
  onSaveComplete?: (updated: AssessmentManual) => void;
}

export default function AssessmentManualCard({
  pipelineId,
  assessmentManual,
  onSaveComplete
}: AssessmentManualCardProps) {
  const [isEditing, setIsEditing] = useState<boolean>(!assessmentManual?.resumen_texto);
  const [resumenTexto, setResumenTexto] = useState<string>(assessmentManual?.resumen_texto || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  // Sync state if assessmentManual prop changes
  useEffect(() => {
    if (assessmentManual?.resumen_texto) {
      setResumenTexto(assessmentManual.resumen_texto);
      if (!isEditing && !isSaving) {
        setIsEditing(false);
      }
    }
  }, [assessmentManual]);

  const handleStartEditing = () => {
    setResumenTexto(assessmentManual?.resumen_texto || '');
    setToastError(null);
    setToastSuccess(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setResumenTexto(assessmentManual?.resumen_texto || '');
    setToastError(null);
    setToastSuccess(null);
    if (assessmentManual?.resumen_texto) {
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    if (!resumenTexto.trim()) {
      setToastError('El resumen de evaluación técnica no puede estar vacío.');
      return;
    }

    if (!pipelineId) {
      setToastError('Identificador del expediente no disponible.');
      return;
    }

    setIsSaving(true);
    setToastError(null);
    setToastSuccess(null);

    try {
      // Inmutabilidad temporal: la fecha de evaluación la inyecta obligatoriamente el backend.
      const res = await actualizarAssessmentManualAction(pipelineId, resumenTexto.trim());

      if (res.success) {
        setToastSuccess('Evaluación técnica registrada correctamente.');
        setIsEditing(false);
        const updatedData: AssessmentManual = res.data?.f2_evaluacion?.assessment_manual || {
          resumen_texto: resumenTexto.trim(),
          fecha_evaluacion: res.data?.fecha_evaluacion || new Date().toISOString()
        };
        if (onSaveComplete) {
          onSaveComplete(updatedData);
        }
      } else {
        // Fail-Fast: Se captura el error y se notifica sin aplicar cambios locales ficticios
        setToastError(res.message || 'Error al guardar la evaluación técnica. Por favor, reintente.');
      }
    } catch (err: any) {
      setToastError(`Error de red al conectar con el servidor: ${err.message || 'Inténtelo nuevamente.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Format visual timestamp with user's timezone (Europe/Madrid / Local)
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return null;

      const dateStr = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Madrid'
      });

      const timeStr = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Madrid'
      });

      return `Evaluación registrada el ${dateStr} a las ${timeStr}`;
    } catch (_) {
      return null;
    }
  };

  const formattedDate = formatTimestamp(assessmentManual?.fecha_evaluacion);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-4 relative overflow-hidden">
      {/* Toast Notifications (Fail-Fast) */}
      {toastError && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{toastError}</span>
          </div>
          <button 
            onClick={() => setToastError(null)}
            className="text-rose-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {toastSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb]">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Resumen de Evaluación Técnica</span>
              <span className="text-[9px] bg-[#6bd8cb]/10 text-[#6bd8cb] px-2 py-0.5 rounded-full font-mono font-bold border border-[#6bd8cb]/20">
                F2 Assessment Manual
              </span>
            </h3>
            <p className="text-[10px] text-[#879391] mt-0.5">
              Registro experto de fortalezas, debilidades y veredicto del reclutador
            </p>
          </div>
        </div>

        {!isEditing && assessmentManual?.resumen_texto && (
          <button
            onClick={handleStartEditing}
            className="px-3 py-1.5 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/10 hover:bg-[#6bd8cb] hover:text-stone-950 text-[#6bd8cb] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
        )}
      </div>

      {/* Body: Form or Read-Only Mode */}
      {isEditing ? (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#879391] tracking-wider block flex justify-between items-center">
              <span>Redacción de Conclusiones Técnicas</span>
              <span className="font-mono text-[9px] text-[#879391]">
                {resumenTexto.length} caracteres
              </span>
            </label>
            <textarea
              rows={6}
              value={resumenTexto}
              onChange={(e) => setResumenTexto(e.target.value)}
              disabled={isSaving}
              placeholder="Redacta aquí el dictamen técnico: fortalezas clave del candidato, áreas de mejora detectadas en la prueba y veredicto final..."
              className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-[#6bd8cb] focus:ring-1 focus:ring-[#6bd8cb] text-white text-xs leading-relaxed placeholder:text-white/30 resize-y transition-all outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            {assessmentManual?.resumen_texto && (
              <button
                type="button"
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !resumenTexto.trim()}
              className="px-4 py-2 rounded-xl bg-[#6bd8cb] hover:bg-[#5bca9c] disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Evaluación</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : assessmentManual?.resumen_texto ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Formatted Text Content */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-[#6bd8cb] text-[11px] font-bold">
              <FileText className="w-3.5 h-3.5" />
              <span>Conclusiones y Dictamen Técnico:</span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed font-normal whitespace-pre-line">
              {assessmentManual.resumen_texto}
            </p>
          </div>

          {/* Visual Timestamp Badge */}
          {formattedDate ? (
            <div className="flex items-center gap-2 text-[11px] text-[#879391] bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/5 w-fit">
              <Clock className="w-3.5 h-3.5 text-[#6bd8cb]" />
              <span className="font-medium text-white/80">{formattedDate}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-[#879391] bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/5 w-fit">
              <Clock className="w-3.5 h-3.5 text-[#6bd8cb]" />
              <span className="font-medium text-white/80">Evaluación registrada en el sistema</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/10 text-center space-y-2">
          <p className="text-xs text-[#879391]">No se ha redactado un resumen de evaluación técnica para este expediente.</p>
          <button
            onClick={handleStartEditing}
            className="px-3.5 py-2 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#6bd8cb] hover:text-stone-950 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Redactar Evaluación Técnica</span>
          </button>
        </div>
      )}
    </div>
  );
}
