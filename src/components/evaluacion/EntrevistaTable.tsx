'use client';

import React from 'react';
import { 
  Sparkles, 
  Eye, 
  FileText, 
  Clock, 
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Compass,
  DollarSign
} from 'lucide-react';
import type { EvaluacionCandidate } from '@/lib/evaluacion';
import type { DensityMode } from '@/components/screening/DensitySelector';

interface EntrevistaTableProps {
  candidates: EvaluacionCandidate[];
  density: DensityMode;
  handleSort?: (field: string) => void;
  renderSortIcon?: (field: string) => React.ReactNode;
  handleViewCv: (id: string, url_cv?: string) => void;
  onOpenTranscriptModal: (cad: EvaluacionCandidate) => void;
  onViewDetails: (cad: EvaluacionCandidate) => void;
}

export default function EntrevistaTable({
  candidates,
  density,
  handleSort,
  renderSortIcon,
  handleViewCv,
  onOpenTranscriptModal,
  onViewDetails,
}: EntrevistaTableProps) {

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 text-left animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#161a1b]/80 text-[10px] uppercase font-bold tracking-wider text-[#6bd8cb]">
              <th className="py-3.5 px-4 select-none min-w-[200px] cursor-pointer hover:text-white" onClick={() => handleSort?.('name')}>
                <span>Candidato</span> {renderSortIcon?.('name')}
              </th>
              <th className="py-3.5 px-4 select-none min-w-[260px] max-w-[360px] cursor-pointer hover:text-white" onClick={() => handleSort?.('exp_entrevista')}>
                <span>Experiencia Consolidada</span> {renderSortIcon?.('exp_entrevista')}
              </th>
              <th className="py-3.5 px-4 select-none min-w-[240px] max-w-[340px] cursor-pointer hover:text-white" onClick={() => handleSort?.('alig_entrevista')}>
                <span>Alineación y Motivadores</span> {renderSortIcon?.('alig_entrevista')}
              </th>
              <th className="py-3.5 px-4 select-none min-w-[220px] max-w-[300px] cursor-pointer hover:text-white" onClick={() => handleSort?.('pretension')}>
                <span>Pretensión y Condiciones</span> {renderSortIcon?.('pretension')}
              </th>
              <th className="py-3.5 px-4 select-none min-w-[240px] max-w-[340px] cursor-pointer hover:text-white" onClick={() => handleSort?.('auditoria')}>
                <span>Auditoría de Veracidad</span> {renderSortIcon?.('auditoria')}
              </th>
              <th className="py-3.5 px-4 select-none min-w-[200px] max-w-[300px] cursor-pointer hover:text-white" onClick={() => handleSort?.('notes')}>
                <span>NOTAS RECLUTADOR EVALUACIONES</span> {renderSortIcon?.('notes')}
              </th>
              <th className="py-3.5 px-4 text-center select-none text-[#6bd8cb]/50 min-w-[200px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[11px] text-white">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#879391] font-bold text-xs uppercase tracking-wider">
                  No se encontraron candidatos con informe de entrevista de screening que coincidan con los criterios.
                </td>
              </tr>
            ) : (
              candidates.map((cad, index) => {
                const informe = cad.informe_entrevista_ia;
                
                const expStr = typeof informe?.experiencia_consolidada === 'string'
                  ? informe.experiencia_consolidada
                  : (informe?.experiencia_consolidada?.resumen_trayectoria || '');

                const aligStr = typeof informe?.alineacion_motivadores === 'string'
                  ? informe.alineacion_motivadores
                  : (informe?.alineacion_motivadores?.encaje_cultural || '');

                const pretension = informe?.pretension_economica_condiciones || {};
                const auditoria = informe?.auditoria_veracidad || {};
                const inconsistencias = Array.isArray(auditoria.inconsistencias_detectadas) ? auditoria.inconsistencias_detectadas : [];
                const fortalezas = Array.isArray(auditoria.confirmaciones_fortalezas) ? auditoria.confirmaciones_fortalezas : [];

                const paddingClass = density === 'compact' ? 'py-3 px-4' : 'py-5 px-5';
                const isTopRow = index < 2;
                const popoverPosLeft = isTopRow ? 'top-full mt-2 left-0' : 'bottom-full mb-2 left-0';
                const popoverPosCenter = isTopRow ? 'top-full mt-2 left-1/2 -translate-x-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2';
                const popoverPosRight = isTopRow ? 'top-full mt-2 right-0' : 'bottom-full mb-2 right-0';

                const hasInforme = Boolean(informe && (expStr || pretension.pretension_salarial || aligStr));

                return (
                  <tr key={cad.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Candidato */}
                    <td className={`${paddingClass} font-bold text-white`}>
                      <div className="flex flex-col">
                        <button
                          onClick={() => onViewDetails(cad)}
                          className="text-white text-xs font-bold hover:text-[#6bd8cb] transition-colors cursor-pointer text-left hover:underline flex items-center gap-1.5"
                        >
                          <span>{cad.name}</span>
                        </button>
                        <span className="text-[10px] text-[#879391] font-normal">
                          {cad.role}
                        </span>
                        <span className="text-[9px] text-[#6bd8cb] font-normal mt-0.5">
                          {cad.client} • {cad.location}
                        </span>
                      </div>
                    </td>

                    {/* Experiencia Consolidada */}
                    <td className={`${paddingClass} min-w-[260px] max-w-[360px] relative group`}>
                      {expStr ? (
                        <>
                          <div className="flex items-start gap-1.5 cursor-help">
                            <p className={`text-[10.5px] text-white/90 leading-relaxed font-normal flex-grow ${density === 'compact' ? 'line-clamp-2' : ''}`}>
                              {expStr}
                            </p>
                            <span className="shrink-0 p-0.5 rounded-full bg-[#6bd8cb]/20 text-[#6bd8cb] group-hover:bg-[#6bd8cb] group-hover:text-black transition-all mt-0.5" title="Ver detalle completo de experiencia">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </span>
                          </div>

                          {/* Hover Popover */}
                          <div className={`absolute ${popoverPosLeft} hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-[#6bd8cb]/40 bg-[#101415]/95 shadow-2xl space-y-2 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                              <FileText className="w-4 h-4 text-[#6bd8cb]" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Experiencia Consolidada
                              </h4>
                            </div>
                            <p className="text-[11px] text-white/95 leading-relaxed font-normal whitespace-pre-wrap">
                              {expStr}
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#879391]/50 italic block">
                          Sin datos de trayectoria registrados
                        </span>
                      )}
                    </td>

                    {/* Alineación y Motivadores */}
                    <td className={`${paddingClass} min-w-[240px] max-w-[340px] relative group`}>
                      {aligStr ? (
                        <>
                          <div className="flex items-start gap-1.5 cursor-help">
                            <p className={`text-[10.5px] text-white/90 leading-relaxed font-normal flex-grow ${density === 'compact' ? 'line-clamp-2' : ''}`}>
                              "{aligStr}"
                            </p>
                            <span className="shrink-0 p-0.5 rounded-full bg-[#c4c1fb]/20 text-[#c4c1fb] group-hover:bg-[#c4c1fb] group-hover:text-black transition-all mt-0.5" title="Ver motivadores completos">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </span>
                          </div>

                          {/* Hover Popover */}
                          <div className={`absolute ${popoverPosCenter} hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-[#c4c1fb]/40 bg-[#101415]/95 shadow-2xl space-y-2 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                              <Compass className="w-4 h-4 text-[#c4c1fb]" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Alineación y Motivadores ("Qué busca")
                              </h4>
                            </div>
                            <p className="text-[11px] text-white/95 leading-relaxed font-normal whitespace-pre-wrap">
                              "{aligStr}"
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#879391]/50 italic block">
                          Sin motivadores analizados
                        </span>
                      )}
                    </td>

                    {/* Pretensión Económica y Condiciones */}
                    <td className={`${paddingClass} min-w-[220px] max-w-[300px] relative group`}>
                      {pretension.pretension_salarial || pretension.disponibilidad || pretension.modalidad_preferida ? (
                        <>
                          <div className="space-y-1 cursor-help">
                            <div className="flex items-center gap-1 text-[#6bd8cb] font-bold text-xs">
                              <DollarSign className="w-3.5 h-3.5 shrink-0" />
                              <span>{pretension.pretension_salarial || "No especificada"}</span>
                              <span className="shrink-0 ml-auto p-0.5 rounded-full bg-white/10 text-white/70 group-hover:bg-white group-hover:text-black transition-all" title="Ver condiciones completas">
                                <HelpCircle className="w-3 h-3" />
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[9.5px] text-[#879391]">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white">
                                {pretension.disponibilidad || "Disp: N/E"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[#c4c1fb]">
                                {pretension.modalidad_preferida || "Mod: N/E"}
                              </span>
                            </div>
                          </div>

                          {/* Hover Popover */}
                          <div className={`absolute ${popoverPosCenter} hidden group-hover:block z-50 w-80 p-4 rounded-2xl glass-panel border border-white/20 bg-[#101415]/95 shadow-2xl space-y-3 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                              <DollarSign className="w-4 h-4 text-[#6bd8cb]" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Pretensión Económica y Condiciones
                              </h4>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-[#879391] block">Pretensión Salarial</span>
                                <span className="font-bold text-[#6bd8cb]">{pretension.pretension_salarial || "No especificada"}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-[#879391] block">Disponibilidad</span>
                                <span className="font-bold text-white">{pretension.disponibilidad || "No especificada"}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-[#879391] block">Modalidad Preferida</span>
                                <span className="font-bold text-[#c4c1fb]">{pretension.modalidad_preferida || "No especificada"}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#879391]/50 italic block">
                          Sin pretensión salarial registrada
                        </span>
                      )}
                    </td>

                    {/* Auditoría de Veracidad */}
                    <td className={`${paddingClass} min-w-[240px] max-w-[340px] relative group`}>
                      {inconsistencias.length > 0 || fortalezas.length > 0 ? (
                        <>
                          <div className="space-y-1.5 cursor-help">
                            {inconsistencias.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                                <span className="truncate flex-grow">
                                  {inconsistencias.length} Inconsistencia{inconsistencias.length > 1 ? 's' : ''} detectada{inconsistencias.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            {fortalezas.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                <span className="truncate flex-grow">
                                  {fortalezas.length} Fortaleza{fortalezas.length > 1 ? 's' : ''} validada{fortalezas.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover Popover */}
                          <div className={`absolute ${popoverPosRight} hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-amber-500/30 bg-[#101415]/95 shadow-2xl space-y-3 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Auditoría de Veracidad (Cruce Transcripción vs CV)
                              </h4>
                            </div>

                            {inconsistencias.length > 0 && (
                              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-rose-400 block flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Inconsistencias Detectadas
                                </span>
                                <ul className="list-disc pl-4 text-rose-200 text-[10.5px] space-y-1">
                                  {inconsistencias.map((inc: string, i: number) => (
                                    <li key={i}>{inc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {fortalezas.length > 0 && (
                              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-emerald-400 block flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Confirmaciones / Fortalezas Validadas
                                </span>
                                <ul className="list-disc pl-4 text-emerald-200 text-[10.5px] space-y-1">
                                  {fortalezas.map((fort: string, i: number) => (
                                    <li key={i}>{fort}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#879391]/50 italic block">
                          Sin observaciones de veracidad
                        </span>
                      )}
                    </td>

                    {/* NOTAS RECLUTADOR EVALUACIONES */}
                    <td className={`${paddingClass} min-w-[200px] max-w-[300px] relative group`}>
                      {cad.recruiterNotes ? (
                        <>
                          <div className="flex items-start gap-1.5 cursor-help p-2 rounded-lg bg-[#6bd8cb]/10 border border-[#6bd8cb]/25 text-[#6bd8cb] text-[10px] leading-snug font-medium shadow-sm">
                            <FileText className="w-3.5 h-3.5 text-[#6bd8cb] shrink-0 mt-0.5" />
                            <span className="text-white font-medium line-clamp-2 flex-grow">{cad.recruiterNotes}</span>
                            <span className="shrink-0 p-0.5 rounded-full bg-[#6bd8cb]/20 text-[#6bd8cb] group-hover:bg-[#6bd8cb] group-hover:text-black transition-all">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </span>
                          </div>

                          {/* Hover Popover */}
                          <div className={`absolute ${popoverPosRight} hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-[#6bd8cb]/40 bg-[#101415]/95 shadow-2xl space-y-2 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                              <HelpCircle className="w-4 h-4 text-[#6bd8cb]" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Notas Reclutador Evaluaciones
                              </h4>
                            </div>
                            <p className="text-[11px] text-white/95 leading-relaxed font-normal whitespace-pre-line">
                              {cad.recruiterNotes}
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#879391]/50 italic block">
                          Sin notas registradas
                        </span>
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

                        {/* Analizar o Re-analizar Transcripción */}
                        <button
                          onClick={() => onOpenTranscriptModal(cad)}
                          className="px-2.5 py-1 rounded-xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 shadow-sm"
                          title={hasInforme ? 'Re-analizar transcripción de entrevista' : 'Cargar transcripción de entrevista de screening'}
                        >
                          <Sparkles className="w-3 h-3 text-[#6bd8cb]" />
                          <span>{hasInforme ? 'Re-analizar' : 'Analizar Transcripción'}</span>
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
