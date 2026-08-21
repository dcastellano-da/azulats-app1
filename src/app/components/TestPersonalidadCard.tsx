'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  Edit2, 
  RefreshCw, 
  Clock, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Sliders 
} from 'lucide-react';
import { actualizarTestPersonalidadAction } from '@/actions/pipeline';
import type { TestPersonalidad, DimensionesPsicometricas } from '@/types/screening';

interface TestPersonalidadCardProps {
  pipelineId?: string;
  testPersonalidad?: TestPersonalidad | null;
  onEditClick?: () => void;
  onReanalyzeClick?: () => void;
  onSaveComplete?: (updatedTest: TestPersonalidad) => void;
}

export default function TestPersonalidadCard({
  pipelineId,
  testPersonalidad,
  onEditClick,
  onReanalyzeClick,
  onSaveComplete
}: TestPersonalidadCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form states for Human-in-the-Loop editing
  const [editCodigo, setEditCodigo] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editEncaje, setEditEncaje] = useState('');
  const [editDimensiones, setEditDimensiones] = useState<DimensionesPsicometricas>({
    dim_mente: 50,
    dim_energia: 50,
    dim_naturaleza: 50,
    dim_tactica: 50,
    dim_identidad: 50
  });

  const handleStartEditing = () => {
    if (testPersonalidad) {
      setEditCodigo(testPersonalidad.arquetipo_codigo || '');
      setEditNombre(testPersonalidad.arquetipo_nombre || '');
      setEditEncaje(testPersonalidad.analisis_encaje || '');
      setEditDimensiones({
        dim_mente: testPersonalidad.dimensiones?.dim_mente ?? 50,
        dim_energia: testPersonalidad.dimensiones?.dim_energia ?? 50,
        dim_naturaleza: testPersonalidad.dimensiones?.dim_naturaleza ?? 50,
        dim_tactica: testPersonalidad.dimensiones?.dim_tactica ?? 50,
        dim_identidad: testPersonalidad.dimensiones?.dim_identidad ?? 50
      });
    }
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!pipelineId) return;

    setIsSaving(true);
    setSaveError(null);

    const updatedObject: TestPersonalidad = {
      arquetipo_codigo: editCodigo.trim().toUpperCase() || 'ENTJ-A',
      arquetipo_nombre: editNombre.trim() || 'Comandante',
      dimensiones: editDimensiones,
      analisis_encaje: editEncaje.trim(),
      fecha_analisis: testPersonalidad?.fecha_analisis || new Date().toISOString()
    };

    try {
      const res = await actualizarTestPersonalidadAction(pipelineId, updatedObject);
      if (res.success) {
        setIsEditing(false);
        if (onSaveComplete) {
          onSaveComplete(updatedObject);
        }
      } else {
        setSaveError(res.message || 'Error al guardar los cambios en el test de personalidad.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error de conexión al guardar el test de personalidad.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!testPersonalidad || !testPersonalidad.arquetipo_codigo) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-4 relative overflow-hidden bg-white/[0.02]">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#9b5de5]/15 border border-[#9b5de5]/30 text-[#9b5de5]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Cognitive Fit Vision (CFV) — Test de Personalidad</span>
              </h3>
              <p className="text-[10px] text-[#879391] mt-0.5">
                Análisis psicométrico automatizado por IA cruzando 16Personalities y vacante
              </p>
            </div>
          </div>

          {onReanalyzeClick && (
            <button
              onClick={onReanalyzeClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#9b5de5] to-[#6bd8cb] text-stone-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:brightness-110"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analizar Test</span>
            </button>
          )}
        </div>

        <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl space-y-2 bg-white/[0.01]">
          <Brain className="w-8 h-8 text-[#879391]/50 mx-auto" />
          <p className="text-xs text-[#c4c1fb] font-semibold">Sin test de personalidad procesado.</p>
          <p className="text-[11px] text-[#879391] max-w-sm mx-auto">
            Sube una captura de pantalla del test (16Personalities u otros) para inferir arquetipos, 5 dimensiones y grado de encaje cultural.
          </p>
        </div>
      </div>
    );
  }

  const dims = testPersonalidad.dimensiones || {
    dim_mente: 50,
    dim_energia: 50,
    dim_naturaleza: 50,
    dim_tactica: 50,
    dim_identidad: 50
  };

  // Ejes bivalentes
  const axes = [
    { key: 'dim_mente', labelLeft: 'Extravertido', labelRight: 'Introvertido', value: dims.dim_mente },
    { key: 'dim_energia', labelLeft: 'Intuitivo', labelRight: 'Observador', value: dims.dim_energia },
    { key: 'dim_naturaleza', labelLeft: 'Racional', labelRight: 'Emocional', value: dims.dim_naturaleza },
    { key: 'dim_tactica', labelLeft: 'Planificador', labelRight: 'Prospectivo', value: dims.dim_tactica },
    { key: 'dim_identidad', labelLeft: 'Asertivo', labelRight: 'Turbulento', value: dims.dim_identidad },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-6 relative overflow-hidden bg-white/[0.02]">
      {/* Luz ambiental */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#9b5de5]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#9b5de5]/20 to-[#6bd8cb]/20 border border-[#9b5de5]/40 text-[#c4c1fb] shadow-inner">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Cognitive Fit Vision — Test de Personalidad
              </h3>
              <span className="text-[9px] font-mono text-[#9b5de5] bg-[#9b5de5]/10 px-2 py-0.5 rounded border border-[#9b5de5]/20 uppercase font-bold">
                f2_evaluacion.test_personalidad
              </span>
            </div>
            {testPersonalidad.fecha_analisis && (
              <p className="text-[10px] text-[#879391] font-mono mt-0.5">
                Generado: {new Date(testPersonalidad.fecha_analisis).toLocaleString('es-ES')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={handleStartEditing}
                className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-[#9b5de5]/40 bg-white/5 hover:bg-[#9b5de5]/10 text-white/90 hover:text-[#c4c1fb] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Editar test manualmente (Human-in-the-Loop)"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#c4c1fb]" />
                <span>Editar Test</span>
              </button>

              {onReanalyzeClick && (
                <button
                  type="button"
                  onClick={onReanalyzeClick}
                  className="px-3 py-1.5 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/15 hover:bg-[#6bd8cb] hover:text-stone-950 text-[#6bd8cb] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#6bd8cb]/10"
                  title="Volver a analizar otra captura"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-analizar</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alerta de Error de Guardado */}
      {saveError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-rose-400 font-bold hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Modo Lectura (Normal) */}
      {!isEditing ? (
        <div className="space-y-6 relative z-10">
          {/* Bloque Arquetipo & Encaje */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta de Arquetipo */}
            <div className="p-4 rounded-2xl border border-[#9b5de5]/30 bg-gradient-to-br from-[#9b5de5]/10 via-black/40 to-black/60 flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#c4c1fb]">Arquetipo Extraído</span>
              <div>
                <span className="text-2xl font-black text-white block tracking-tight">
                  {testPersonalidad.arquetipo_codigo}
                </span>
                <span className="text-xs font-bold text-[#6bd8cb] block mt-0.5">
                  "{testPersonalidad.arquetipo_nombre}"
                </span>
              </div>
              <div className="text-[9px] text-[#879391] font-mono pt-2 border-t border-white/5">
                Evaluado con IA Vertex Gemini 2.5
              </div>
            </div>

            {/* Análisis de Encaje Cultural */}
            <div className="md:col-span-2 p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#6bd8cb] tracking-wider block flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#6bd8cb]" />
                Análisis de Encaje Cultural & Conductual (Cultural Fit)
              </span>
              <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap font-normal">
                {testPersonalidad.analisis_encaje}
              </p>
            </div>
          </div>

          {/* Barras Bivalentes de las 5 Dimensiones Psicométricas */}
          <div className="p-5 rounded-2xl border border-white/10 bg-black/50 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest block flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#c4c1fb]" />
              Dimensiones Psicométricas (Barras Bivalentes)
            </span>

            <div className="space-y-3.5">
              {axes.map((ax) => {
                const val = ax.value;
                const pctRight = val;
                const pctLeft = 100 - val;
                const dominantLeft = pctLeft >= 50;

                return (
                  <div key={ax.key} className="space-y-1 text-xs">
                    {/* Etiquetas en los extremos opuestos */}
                    <div className="flex justify-between items-center text-[10.5px] font-bold">
                      <span className={dominantLeft ? 'text-[#6bd8cb]' : 'text-white/60'}>
                        {ax.labelLeft} ({pctLeft}%)
                      </span>
                      <span className={!dominantLeft ? 'text-[#9b5de5]' : 'text-white/60'}>
                        {ax.labelRight} ({pctRight}%)
                      </span>
                    </div>

                    {/* Barra visual bivalente */}
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative flex">
                      <div
                        className="h-full bg-[#6bd8cb] transition-all duration-500 rounded-l-full"
                        style={{ width: `${pctLeft}%` }}
                      />
                      <div
                        className="h-full bg-[#9b5de5] transition-all duration-500 rounded-r-full"
                        style={{ width: `${pctRight}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Formulario de Edición Integrada (Human-in-the-Loop) */
        <div className="space-y-5 p-5 rounded-2xl border border-[#9b5de5]/30 bg-black/60 relative z-10 animate-fadeIn text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="font-bold text-[#c4c1fb] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-[#c4c1fb]" />
              Edición Manual del Test de Personalidad (Human-in-the-Loop)
            </span>
            <span className="text-[10px] text-[#879391]">Corregir arquetipo o porcentajes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/70 uppercase block">Código Arquetipo</label>
              <input
                type="text"
                value={editCodigo}
                onChange={(e) => setEditCodigo(e.target.value)}
                placeholder="ej: ENTJ-A, INFP-T..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold focus:border-[#9b5de5] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/70 uppercase block">Título / Nombre Arquetipo</label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="ej: Comandante, Mediador..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-semibold focus:border-[#9b5de5] focus:outline-none"
              />
            </div>
          </div>

          {/* Sliders de las 5 Dimensiones */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-bold text-[#6bd8cb] uppercase tracking-wider block">
              Ajuste de Porcentajes por Eje Psicométrico (0 a 100)
            </span>

            {[
              { key: 'dim_mente', left: 'Extravertido', right: 'Introvertido' },
              { key: 'dim_energia', left: 'Intuitivo', right: 'Observador' },
              { key: 'dim_naturaleza', left: 'Racional', right: 'Emocional' },
              { key: 'dim_tactica', left: 'Planificador', right: 'Prospectivo' },
              { key: 'dim_identidad', left: 'Asertivo', right: 'Turbulento' },
            ].map((axis) => {
              const currentVal = (editDimensiones as any)[axis.key] ?? 50;
              const pctRight = currentVal;
              const pctLeft = 100 - currentVal;
              const dominantLeft = pctLeft >= 50;

              return (
                <div key={axis.key} className="space-y-1">
                  <div className="flex justify-between text-[10.5px] font-bold">
                    <span className={dominantLeft ? 'text-[#6bd8cb]' : 'text-white/60'}>
                      {axis.left} ({pctLeft}%)
                    </span>
                    <span className={!dominantLeft ? 'text-[#9b5de5]' : 'text-white/60'}>
                      {axis.right} ({pctRight}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      setEditDimensiones(prev => ({ ...prev, [axis.key]: num }));
                    }}
                    className="w-full accent-[#6bd8cb] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Análisis de Encaje */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-bold text-white/70 uppercase block">Análisis de Encaje Cultural</label>
            <textarea
              rows={3}
              value={editEncaje}
              onChange={(e) => setEditEncaje(e.target.value)}
              placeholder="Párrafo breve argumentando el encaje conductual del candidato..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:border-[#9b5de5] focus:outline-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#9b5de5] to-[#6bd8cb] text-stone-950 font-extrabold flex items-center gap-1.5 cursor-pointer hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
