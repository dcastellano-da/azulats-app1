'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  Sparkles, 
  Eye, 
  FileText, 
  Edit2, 
  Clock, 
  MoreHorizontal, 
  Compass, 
  Sliders 
} from 'lucide-react';
import type { EvaluacionCandidate } from '@/lib/evaluacion';
import type { DensityMode } from '@/components/screening/DensitySelector';

interface TestPersonalidadTableProps {
  candidates: EvaluacionCandidate[];
  density: DensityMode;
  handleSort?: (field: string) => void;
  renderSortIcon?: (field: string) => React.ReactNode;
  handleViewCv: (id: string, url_cv?: string) => void;
  onOpenAnalysisModal: (cad: EvaluacionCandidate) => void;
  onViewDetails: (cad: EvaluacionCandidate) => void;
}

export default function TestPersonalidadTable({
  candidates,
  density,
  handleSort,
  renderSortIcon,
  handleViewCv,
  onOpenAnalysisModal,
  onViewDetails,
}: TestPersonalidadTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const getDimensionBars = (dims: any) => {
    if (!dims) return [];
    return [
      { key: 'dim_mente', left: 'Ext', right: 'Int', leftFull: 'Extravertido', rightFull: 'Introvertido', val: dims.dim_mente ?? 50 },
      { key: 'dim_energia', left: 'Int', right: 'Obs', leftFull: 'Intuitivo', rightFull: 'Observador', val: dims.dim_energia ?? 50 },
      { key: 'dim_naturaleza', left: 'Rac', right: 'Emo', leftFull: 'Racional', rightFull: 'Emocional', val: dims.dim_naturaleza ?? 50 },
      { key: 'dim_tactica', left: 'Pla', right: 'Pro', leftFull: 'Planificador', rightFull: 'Prospectivo', val: dims.dim_tactica ?? 50 },
      { key: 'dim_identidad', left: 'Ase', right: 'Tur', leftFull: 'Asertivo', rightFull: 'Turbulento', val: dims.dim_identidad ?? 50 },
    ];
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 text-left animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#161a1b]/80 text-[10px] uppercase font-bold tracking-wider text-[#c4c1fb]">
              <th className="py-3.5 px-4 select-none min-w-[200px]">
                <span>Candidato</span>
              </th>
              <th className="py-3.5 px-4 select-none min-w-[140px]">
                <span>Arquetipo Extraído</span>
              </th>
              <th className="py-3.5 px-4 select-none min-w-[320px] max-w-[420px]">
                <span>Dimensiones Psicométricas</span>
              </th>
              <th className="py-3.5 px-4 select-none min-w-[280px] max-w-[400px]">
                <span>Veredicto de Alineación (Cultural Fit)</span>
              </th>
              <th className="py-3.5 px-4 select-none min-w-[130px]">
                <span>Fecha Análisis</span>
              </th>
              <th className="py-3.5 px-4 text-center select-none text-[#c4c1fb]/50 min-w-[200px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[11px] text-white">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#879391] font-bold text-xs uppercase tracking-wider">
                  No se encontraron candidatos con test de personalidad que coincidan con los criterios.
                </td>
              </tr>
            ) : (
              candidates.map((cad) => {
                const test = cad.test_personalidad;
                const dims = getDimensionBars(test?.dimensiones);
                const paddingClass = density === 'compact' ? 'py-3 px-4' : 'py-5 px-5';

                return (
                  <tr key={cad.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Candidato */}
                    <td className={`${paddingClass} font-bold text-white`}>
                      <div className="flex flex-col">
                        <button
                          onClick={() => onViewDetails(cad)}
                          className="text-white text-xs font-bold hover:text-[#6bd8cb] transition-colors cursor-pointer text-left hover:underline"
                        >
                          {cad.name}
                        </button>
                        <span className="text-[10px] text-[#879391] font-normal">
                          {cad.role}
                        </span>
                        <span className="text-[9px] text-[#6bd8cb] font-normal mt-0.5">
                          {cad.client} • {cad.location}
                        </span>
                      </div>
                    </td>

                    {/* Arquetipo Extraído */}
                    <td className={paddingClass}>
                      {test && test.arquetipo_codigo ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#9b5de5]/15 border border-[#9b5de5]/30 text-[#c4c1fb] font-mono font-bold text-xs w-max shadow-sm">
                            <Brain className="w-3.5 h-3.5 text-[#9b5de5]" />
                            <span>{test.arquetipo_codigo}</span>
                          </span>
                          {test.arquetipo_nombre && (
                            <span className="text-[10px] text-white/80 font-bold truncate max-w-[150px]">
                              "{test.arquetipo_nombre}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#879391]/60 italic block">
                          Sin test procesado
                        </span>
                      )}
                    </td>

                    {/* Dimensiones Psicométricas (Barras Bivalentes) */}
                    <td className={`${paddingClass} min-w-[320px] max-w-[420px]`}>
                      {test && dims.length > 0 ? (
                        density === 'compact' ? (
                          /* Visualización Compacta: Micro-chips bivalentes con tooltips */
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {dims.map((dim) => {
                              const pctRight = dim.val;
                              const pctLeft = 100 - dim.val;
                              const isLeftDominant = pctLeft >= 50;

                              return (
                                <div
                                  key={dim.key}
                                  title={`${dim.leftFull} (${pctLeft}%) vs ${dim.rightFull} (${pctRight}%)`}
                                  className="px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 text-[9px] font-bold flex items-center gap-1 cursor-help"
                                >
                                  <span className={isLeftDominant ? 'text-[#6bd8cb]' : 'text-white/40'}>
                                    {dim.left} {pctLeft}%
                                  </span>
                                  <span className="text-white/20">|</span>
                                  <span className={!isLeftDominant ? 'text-[#9b5de5]' : 'text-white/40'}>
                                    {dim.right} {pctRight}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Visualización Expandida: Barras de progreso bivalentes completas */
                          <div className="space-y-2">
                            {dims.map((dim) => {
                              const pctRight = dim.val;
                              const pctLeft = 100 - dim.val;

                              return (
                                <div key={dim.key} className="space-y-0.5 text-[9.5px]">
                                  <div className="flex justify-between items-center font-semibold text-white/80">
                                    <span className="text-[#6bd8cb]">{dim.leftFull} ({pctLeft}%)</span>
                                    <span className="text-[#9b5de5]">{dim.rightFull} ({pctRight}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                                    <div className="h-full bg-[#6bd8cb]" style={{ width: `${pctLeft}%` }} />
                                    <div className="h-full bg-[#9b5de5]" style={{ width: `${pctRight}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] text-[#879391]/60 italic block">
                          Sin dimensiones registradas
                        </span>
                      )}
                    </td>

                    {/* Veredicto de Alineación (Cultural Fit) */}
                    <td className={`${paddingClass} min-w-[280px] max-w-[400px]`}>
                      {test && test.analisis_encaje ? (
                        <p className={`text-[10.5px] text-white/90 leading-relaxed font-normal ${density === 'compact' ? 'line-clamp-2' : ''}`}>
                          "{test.analisis_encaje}"
                        </p>
                      ) : (
                        <span className="text-[10px] text-[#879391]/60 italic block">
                          Sin análisis de encaje generado
                        </span>
                      )}
                    </td>

                    {/* Fecha Análisis */}
                    <td className={paddingClass}>
                      {test && test.fecha_analisis ? (
                        <div className="flex items-center gap-1 text-[10px] text-[#879391] font-mono">
                          <Clock className="w-3 h-3 text-[#6bd8cb]" />
                          <span>{new Date(test.fecha_analisis).toLocaleDateString('es-ES')}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#879391]/50 italic block">-</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className={`${paddingClass} text-center min-w-[200px]`}>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Ver Expediente */}
                        <button
                          onClick={() => onViewDetails(cad)}
                          className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white font-bold transition-all text-[10px] cursor-pointer flex items-center gap-1"
                          title="Ver expediente del candidato"
                        >
                          <Eye className="w-3 h-3 text-[#6bd8cb]" />
                          <span>Detalles</span>
                        </button>

                        {/* Analizar o Re-analizar Test */}
                        <button
                          onClick={() => onOpenAnalysisModal(cad)}
                          className="px-2.5 py-1 rounded-xl bg-[#9b5de5]/15 border border-[#9b5de5]/30 text-[#c4c1fb] font-bold hover:bg-[#9b5de5] hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 shadow-sm"
                          title={test ? 'Re-analizar captura de test' : 'Cargar captura de test de personalidad'}
                        >
                          <Sparkles className="w-3 h-3 text-[#9b5de5]" />
                          <span>{test ? 'Re-analizar' : 'Analizar Test'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
