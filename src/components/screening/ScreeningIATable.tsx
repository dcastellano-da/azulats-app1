'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileText, 
  Cpu, 
  ChevronsRight, 
  UserCheck, 
  Ban, 
  MoreHorizontal
} from 'lucide-react';
import { Busqueda } from '@/actions/busquedas';
import { ResultadoScreeningItem } from '@/types/screening';

export interface ScreeningCandidate {
  pipeId?: string;
  id: string;
  searchId?: string;
  searchCode?: string;
  searchRole?: string;
  searchClient?: string;
  name: string;
  role: string;
  client: string;
  location: string;
  phase1State: '01_nuevo' | '02_contactado' | '03_bloqueado' | '04_rechazado';
  score: number;
  lastChangeDate: string;
  ttfme: string;
  outreachVariation: 'A' | 'B';
  customOutreachA: string;
  customOutreachB: string;
  blockReason?: string;
  missingField?: 'cv' | 'salario' | 'ingles';
  motivationNote?: string;
  recruiterNotes?: string;
  socialLinks?: {
    github?: string;
    stackoverflow?: string;
    portfolio?: string;
  };
  rejectionReason?: string;
  url_cv?: string;

  resultadoScreening?: ResultadoScreeningItem[];
  fitScoreScreening?: number;
  tieneKnockout?: boolean;
}

interface ScreeningIATableProps {
  candidates: ScreeningCandidate[];
  activeBusquedas: Busqueda[];
  density: 'compact' | 'expanded';
  handleSort: (field: string) => void;
  renderSortIcon: (field: string) => React.ReactNode;
  getCriterionQuestion: (
    item: ResultadoScreeningItem,
    candidate: ScreeningCandidate,
    idx: number,
    activeBusquedas: Busqueda[]
  ) => string;
  handleViewCv: (id: string, url_cv?: string) => void;
  handleTransitionState: (id: string, state: string, extra?: Record<string, unknown>) => void;
  setCandidateToAdvance: (cad: ScreeningCandidate) => void;
  triggerRejectionFlow: (id: string) => void;
  setSemanticCandidate: (cad: ScreeningCandidate) => void;
  setIsSemanticOpen: (open: boolean) => void;
}

export default function ScreeningIATable({
  candidates,
  activeBusquedas,
  density,
  handleSort,
  renderSortIcon,
  getCriterionQuestion,
  handleViewCv,
  handleTransitionState,
  setCandidateToAdvance,
  triggerRejectionFlow,
  setSemanticCandidate,
  setIsSemanticOpen,
}: ScreeningIATableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 text-left animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#161a1b]/60 text-[10px] uppercase font-bold tracking-wider text-[#c4c1fb]">
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
              >
                <div className="flex items-center">
                  <span>Candidato</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th
                onClick={() => handleSort('score')}
                className="py-3 px-4 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group min-w-[120px]"
              >
                <div className="flex items-center">
                  <span>Fit Score IA</span>
                  {renderSortIcon('score')}
                </div>
              </th>
              <th
                onClick={() => handleSort('knockout')}
                className="py-3 px-4 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group min-w-[180px] max-w-[240px]"
              >
                <div className="flex items-center">
                  <span>Alerta Knockout</span>
                  {renderSortIcon('knockout')}
                </div>
              </th>
              <th className="py-3 px-4 select-none min-w-[320px] max-w-[440px]">
                <span>Desglose Criterios & Semáforo</span>
              </th>
              <th
                onClick={() => handleSort('notes')}
                className="py-3 px-4 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group min-w-[200px] max-w-[260px]"
              >
                <div className="flex items-center">
                  <span>NOTAS DESCUBRIMIENTO</span>
                  {renderSortIcon('notes')}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group min-w-[160px]"
              >
                <div className="flex items-center">
                  <span>Estado</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th className="py-3 px-4 text-center select-none text-[#c4c1fb]/50 min-w-[220px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[11px] text-white">
            {candidates.map((cad) => {
              let statusLabel = '';
              let statusColor = '';
              if (cad.phase1State === '01_nuevo') {
                statusLabel = '01 - Nuevo en Revisión';
                statusColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
              } else if (cad.phase1State === '02_contactado') {
                statusLabel = '02 - Bloqueado / Pendiente';
                statusColor = 'text-[#6bd8cb] bg-[#6bd8cb]/10 border-[#6bd8cb]/20';
              } else if (cad.phase1State === '03_bloqueado') {
                statusLabel = '03 - En Duda a Confirmar';
                statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              } else if (cad.phase1State === '04_rechazado') {
                statusLabel = '04 - Rechazado en Fase Inicial';
                statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
              }

              const fitVal = cad.fitScoreScreening ?? cad.score;
              const isKnockoutActive = cad.tieneKnockout ?? false;
              const hasProcessedScreening =
                cad.resultadoScreening && cad.resultadoScreening.length > 0;
              const failedKnockouts =
                cad.resultadoScreening?.filter(
                  (item) => item.es_knockout && item.evaluacion === 'NO'
                ) || [];
              const allKnockouts =
                cad.resultadoScreening?.filter((item) => item.es_knockout) || [];

              const paddingClass = density === 'compact' ? 'py-2.5 px-4' : 'py-4 px-5';

              return (
                <tr
                  key={cad.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {/* Candidate Info */}
                  <td className={`${paddingClass} font-bold text-white`}>
                    <div className="flex flex-col">
                      <Link
                        href={`/descubrimiento/${cad.pipeId || cad.id}`}
                        className="text-white text-xs font-bold hover:text-[#6bd8cb] underline-offset-2 hover:underline transition-colors cursor-pointer"
                        title="Ver expediente detallado del candidato"
                      >
                        {cad.name}
                      </Link>
                      <span className="text-[10px] text-[#879391] font-normal">
                        {cad.role}
                      </span>
                      <span className="text-[9px] text-[#6bd8cb] font-normal mt-0.5">
                        {cad.client} • {cad.location}
                      </span>
                    </div>
                  </td>

                  {/* Fit Score IA */}
                  <td className={paddingClass}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl font-bold text-xs border ${
                          fitVal >= 90
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : fitVal >= 75
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {fitVal > 0 ? `${fitVal} pts` : '0 pts'}
                      </span>
                    </div>
                  </td>

                  {/* Alerta Knockout */}
                  <td className={`${paddingClass} min-w-[180px] max-w-[240px]`}>
                    {density === 'compact' ? (
                      /* Compact Knockout Badge */
                      <div>
                        {isKnockoutActive ? (
                          <span
                            className="px-2 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[10px] flex items-center gap-1.5 w-max max-w-[220px] truncate cursor-help"
                            title={
                              failedKnockouts.length > 0
                                ? `Falló Knockout: ${failedKnockouts
                                    .map((k, idx) => getCriterionQuestion(k, cad, idx, activeBusquedas))
                                    .join(', ')}`
                                : 'Regla excluyente no superada'
                            }
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                            <span className="truncate">
                              ✕ Fallo: {failedKnockouts.length > 0
                                ? getCriterionQuestion(failedKnockouts[0], cad, 0, activeBusquedas)
                                : 'Knockout'}
                            </span>
                          </span>
                        ) : hasProcessedScreening ? (
                          <span
                            className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1.5 w-max cursor-help"
                            title={`Knockouts OK (${allKnockouts.length} evaluados): ${allKnockouts
                              .map((k, idx) => getCriterionQuestion(k, cad, idx, activeBusquedas))
                              .join(' | ')}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                            <span>✓ Knockouts OK</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-xl bg-slate-500/15 border border-slate-500/30 text-slate-400 font-bold text-[10px] flex items-center gap-1.5 w-max">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Expanded Knockout Breakdown */
                      <div className="flex flex-col gap-1 w-max max-w-[240px]">
                        {isKnockoutActive ? (
                          <>
                            <span className="px-2 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[10px] flex items-center gap-1 w-max">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>INCUMPLIDO</span>
                            </span>
                            {failedKnockouts.length > 0 ? (
                              failedKnockouts.map((kItem, kIdx) => {
                                const qName = getCriterionQuestion(kItem, cad, kIdx, activeBusquedas);
                                return (
                                  <span
                                    key={kIdx}
                                    className="text-[10px] text-rose-300/90 leading-tight font-medium"
                                    title={qName}
                                  >
                                    • {qName}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-rose-300/90 leading-tight italic">
                                • Regla excluyente no superada
                              </span>
                            )}
                          </>
                        ) : hasProcessedScreening ? (
                          <>
                            <span className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>CUMPLIDO</span>
                            </span>
                            {allKnockouts.map((kItem, kIdx) => {
                              const qName = getCriterionQuestion(kItem, cad, kIdx, activeBusquedas);
                              return (
                                <span
                                  key={kIdx}
                                  className="text-[9px] text-[#879391] leading-tight"
                                  title={`Cumplido: ${qName}`}
                                >
                                  • {qName}
                                </span>
                              );
                            })}
                          </>
                        ) : (
                          <>
                            <span className="px-2 py-1 rounded-xl bg-slate-500/15 border border-slate-500/30 text-slate-400 font-bold text-[10px] flex items-center gap-1 w-max">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span>PENDIENTE</span>
                            </span>
                            <span className="text-[9px] text-[#879391] leading-tight italic">
                              • Screening no ejecutado
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Desglose Criterios & Semáforo */}
                  <td className={`${paddingClass} min-w-[320px] max-w-[440px]`}>
                    {density === 'compact' ? (
                      /* Compact Horizontal Micro-chips */
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {cad.resultadoScreening && cad.resultadoScreening.length > 0 ? (
                          cad.resultadoScreening.map((item, idx) => {
                            let semLabel = 'SÍ';
                            let semClass =
                              'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
                            if (item.evaluacion === 'INFERIDO') {
                              semLabel = 'INF';
                              semClass = 'bg-sky-500/20 border-sky-500/30 text-sky-300';
                            } else if (item.evaluacion === 'NO') {
                              semLabel = 'NO';
                              semClass = 'bg-rose-500/20 border-rose-500/30 text-rose-300';
                            }

                            const qText = getCriterionQuestion(item, cad, idx, activeBusquedas);
                            const tooltipContent = `#${idx + 1} ${qText}\nEvaluación: ${item.evaluacion}\nPuntaje: ${
                              item.es_knockout ? 'KNOCKOUT' : `+${item.puntaje_obtenido} pts`
                            }${item.evidencia_cv ? `\nEvidencia: "${item.evidencia_cv}"` : ''}`;

                            return (
                              <div
                                key={idx}
                                title={tooltipContent}
                                className={`px-2 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 cursor-help ${semClass}`}
                              >
                                <span>[{semLabel}]</span>
                                <span className="max-w-[110px] truncate font-normal text-white/90">
                                  {qText}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-[#879391] italic">
                            Sin criterios procesados
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Expanded Vertical Stacking */
                      <div className="flex flex-col gap-2">
                        {cad.resultadoScreening && cad.resultadoScreening.length > 0 ? (
                          cad.resultadoScreening.map((item, idx) => {
                            let semLabel = 'SÍ';
                            let semClass =
                              'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
                            if (item.evaluacion === 'INFERIDO') {
                              semLabel = 'INFERIDO';
                              semClass = 'bg-sky-500/20 border-sky-500/30 text-sky-300';
                            } else if (item.evaluacion === 'NO') {
                              semLabel = 'NO';
                              semClass = 'bg-rose-500/20 border-rose-500/30 text-rose-300';
                            }

                            const qText = getCriterionQuestion(item, cad, idx, activeBusquedas);

                            return (
                              <div key={idx} className="flex items-start gap-2 text-[10px]">
                                <span
                                  className={`px-1.5 py-0.5 rounded border font-bold text-[9px] shrink-0 mt-0.5 ${semClass}`}
                                >
                                  {semLabel}
                                </span>
                                <div className="flex flex-col">
                                  <span
                                    className="text-[#c4c1fb]/90 font-medium leading-snug"
                                    title={qText}
                                  >
                                    {qText}
                                  </span>
                                  <span className="text-[9px] text-[#879391] font-mono mt-0.5">
                                    #{idx + 1}{' '}
                                    {item.es_knockout
                                      ? '(KNOCKOUT)'
                                      : `(+${item.puntaje_obtenido} pts)`}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-[#879391] italic">
                            Sin criterios procesados
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* NOTAS DESCUBRIMIENTO */}
                  <td className={`${paddingClass} min-w-[200px] max-w-[260px]`}>
                    {cad.recruiterNotes ? (
                      <div className="bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 rounded-xl p-2 text-[#6bd8cb] text-[10px] font-normal leading-snug shadow-sm shadow-[#6bd8cb]/5 line-clamp-2">
                        {cad.recruiterNotes}
                      </div>
                    ) : (
                      <span className="text-[#879391] text-[10px] italic">
                        Sin notas registradas
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className={`${paddingClass} min-w-[160px]`}>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${statusColor} inline-block`}
                    >
                      {statusLabel}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className={`${paddingClass} text-center min-w-[220px]`}>
                    {density === 'compact' ? (
                      /* Compact Actions with Menu [...] Dropdown */
                      <div className="flex items-center justify-center gap-1.5 relative">
                        {/* Primary Action 1: Avanzar estado / Fase */}
                        {cad.phase1State === '01_nuevo' && (
                          <button
                            onClick={() => handleTransitionState(cad.id, '02_contactado')}
                            title="A 02 - Bloqueado / Pendiente"
                            className="px-2 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <ChevronsRight className="w-3 h-3 shrink-0" />
                            <span>Avanzar</span>
                          </button>
                        )}
                        {cad.phase1State === '02_contactado' && (
                          <button
                            onClick={() =>
                              handleTransitionState(cad.id, '03_bloqueado', {
                                blockReason:
                                  'Esperando confirmación pretensiones de sueldo y CV',
                                missingField: 'salario',
                              })
                            }
                            title="A 03 - En Duda a Confirmar"
                            className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500 hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <ChevronsRight className="w-3 h-3 shrink-0" />
                            <span>Avanzar</span>
                          </button>
                        )}
                        {cad.phase1State === '03_bloqueado' && (
                          <button
                            onClick={() =>
                              handleTransitionState(cad.id, '04_rechazado', {
                                rejectionReason: 'Falta de información en aclaración',
                              })
                            }
                            title="A 04 - Rechazado en Fase Inicial"
                            className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500 hover:text-white transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <ChevronsRight className="w-3 h-3 shrink-0" />
                            <span>Avanzar</span>
                          </button>
                        )}

                        <button
                          onClick={() => setCandidateToAdvance(cad)}
                          className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                          title="Avanzar a Fase 2 Evaluación"
                        >
                          <UserCheck className="w-3 h-3 shrink-0" />
                          <span>Fase 2</span>
                        </button>

                        {/* Primary Action 2: Rechazar */}
                        {cad.phase1State !== '04_rechazado' && (
                          <button
                            onClick={() => triggerRejectionFlow(cad.id)}
                            className="px-2 py-1 rounded border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-red-400 font-bold transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                            title="Rechazar Candidato"
                          >
                            <Ban className="w-3 h-3 shrink-0" />
                            <span>Rechazar</span>
                          </button>
                        )}

                        {/* Secondary Actions Dropdown Button [...] */}
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(cad.id)}
                            className="p-1 rounded border border-white/10 bg-white/5 text-[#c4c1fb] hover:bg-white/10 transition-all cursor-pointer"
                            title="Más acciones (Detalles, CV, Ficha AI)"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openDropdownId === cad.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 bg-[#1a1f22] border border-white/15 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 min-w-[140px] text-left animate-fadeIn">
                              <Link
                                href={`/descubrimiento/${cad.pipeId || cad.id}`}
                                className="px-2.5 py-1.5 rounded text-white text-[10px] font-medium hover:bg-[#6bd8cb]/15 hover:text-[#6bd8cb] flex items-center gap-1.5 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb]" />
                                <span>Ver Detalles</span>
                              </Link>

                              <button
                                onClick={() => {
                                  handleViewCv(cad.id, cad.url_cv);
                                  setOpenDropdownId(null);
                                }}
                                className={`px-2.5 py-1.5 rounded text-[10px] font-medium flex items-center gap-1.5 transition-colors text-left ${
                                  cad.url_cv
                                    ? 'text-[#6bd8cb] hover:bg-[#6bd8cb]/15'
                                    : 'text-[#879391]/50 cursor-not-allowed'
                                }`}
                                disabled={!cad.url_cv}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Ver CV PDF</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSemanticCandidate(cad);
                                  setIsSemanticOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="px-2.5 py-1.5 rounded text-[#c4c1fb] text-[10px] font-medium hover:bg-[#c4c1fb]/15 flex items-center gap-1.5 transition-colors text-left"
                              >
                                <Cpu className="w-3.5 h-3.5 text-[#c4c1fb]" />
                                <span>Re-evaluar IA</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Expanded Full Action Toolbar */
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <Link
                          href={`/descubrimiento/${cad.pipeId || cad.id}`}
                          className="px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/15 text-white font-bold transition-all text-[10px] cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb]" />
                          <span>Detalles</span>
                        </Link>

                        {cad.url_cv && (
                          <a
                            href={cad.url_cv}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1"
                            title="Ver Curriculum Vitae"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>CV</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setSemanticCandidate(cad);
                            setIsSemanticOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-[#101415] transition-all text-[10px] cursor-pointer flex items-center gap-1"
                          title="Re-evaluar con IA"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Re-evaluar IA</span>
                        </button>

                        {cad.phase1State === '01_nuevo' && (
                          <button
                            onClick={() => handleTransitionState(cad.id, '02_contactado')}
                            title="A 02 - Bloqueado / Pendiente"
                            className="px-2.5 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                            <span>Avanzar estado</span>
                          </button>
                        )}

                        {cad.phase1State === '02_contactado' && (
                          <button
                            onClick={() =>
                              handleTransitionState(cad.id, '03_bloqueado', {
                                blockReason:
                                  'Esperando confirmación pretensiones de sueldo y CV',
                                missingField: 'salario',
                              })
                            }
                            title="A 03 - En Duda a Confirmar"
                            className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500 hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                            <span>Avanzar estado</span>
                          </button>
                        )}

                        {cad.phase1State === '03_bloqueado' && (
                          <button
                            onClick={() =>
                              handleTransitionState(cad.id, '04_rechazado', {
                                rejectionReason: 'Falta de información en aclaración',
                              })
                            }
                            title="A 04 - Rechazado en Fase Inicial"
                            className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500 hover:text-white transition-all text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                            <span>Avanzar estado</span>
                          </button>
                        )}

                        <button
                          onClick={() => setCandidateToAdvance(cad)}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                          title="Avanzar a Fase 2 Evaluación"
                        >
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Avanzar Fase</span>
                        </button>

                        {cad.phase1State !== '04_rechazado' && (
                          <button
                            onClick={() => triggerRejectionFlow(cad.id)}
                            className="px-2 py-1 rounded border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-red-400 font-bold transition-all text-[10px] cursor-pointer flex items-center gap-1"
                            title="Rechazar Candidato"
                          >
                            <Ban className="w-3.5 h-3.5 shrink-0" />
                            <span>Rechazar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {candidates.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-[#879391] font-bold text-xs uppercase tracking-wider"
                >
                  No hay perfiles que coincidan con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
