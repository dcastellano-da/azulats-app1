'use client';

import React, { useState } from "react";
import { Briefcase, Users, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  id: string;
  title: string;
  value: string | number;
  trend: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: React.ReactNode;
  explanation: string;
  formula: string;
  activeHelpId: string | null;
  onToggleHelp: (id: string) => void;
}

function KpiCard({ id, title, value, trend, icon, explanation, formula, activeHelpId, onToggleHelp }: KpiCardProps) {
  const isHelpActive = activeHelpId === id;

  return (
    <div className="glass-panel rounded-2xl p-6 glow-effect relative overflow-hidden backdrop-blur-md min-h-[140px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-[#c4c1fb] uppercase tracking-wider">{title}</p>
            <button
              onClick={() => onToggleHelp(id)}
              className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
              title="Ver criterio y fórmula de cálculo"
            >
              ?
            </button>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
          
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`flex items-center gap-0.5 font-bold ${
                trend.isPositive ? "text-emerald-400" : "text-[#ffb4ab]"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend.value}
            </span>
            <span className="text-[#879391]">{trend.label}</span>
          </div>
        </div>

        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner shrink-0">
          {icon}
        </div>
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-[#0d9488]/5 to-transparent rounded-bl-full pointer-events-none"></div>

      {/* Help Overlay */}
      {isHelpActive && (
        <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center pb-1 border-b border-white/10">
              <span className="text-[10px] font-bold text-[#6bd8cb] uppercase tracking-wider">{title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleHelp(id); }}
                className="text-white/40 hover:text-white font-bold text-[10px] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <p className="text-[10px] text-white/80 leading-normal">
              {explanation}
            </p>
            <p className="text-[8.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
              Fórmula: {formula}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface KpiCardsProps {
  activeSearchesCount?: number;
  candidatesCount?: number;
  allocationTimeAvg?: string;
  isFiltered?: boolean;
}

export default function KpiCards({
  activeSearchesCount,
  candidatesCount,
  allocationTimeAvg,
  isFiltered = false
}: KpiCardsProps) {
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);

  const handleToggleHelp = (id: string) => {
    setActiveHelpId(prev => (prev === id ? null : id));
  };

  const realActiveSearches = activeSearchesCount !== undefined ? activeSearchesCount : 0;
  const realCandidatesCount = candidatesCount !== undefined ? candidatesCount.toLocaleString() : "0";
  const realAllocationTime = allocationTimeAvg || "--";

  const kpis = [
    {
      id: "busquedas_activas",
      title: "Búsquedas Activas",
      value: realActiveSearches,
      trend: {
        value: isFiltered ? "Filtrado" : "Real-time",
        isPositive: true,
        label: isFiltered ? "según filtros aplicados" : "en entidad Búsquedas",
      },
      icon: <Briefcase className="w-5 h-5 text-[#6bd8cb]" />,
      explanation: "Nº de procesos de selección en estado activo o en curso en la plataforma.",
      formula: "Conteos de búsquedas con estado_fase != 'Cerrada' y estado_fase != 'Cancelada'",
    },
    {
      id: "candidatos_bandeja",
      title: "Candidatos en Bandeja",
      value: realCandidatesCount,
      trend: {
        value: isFiltered ? "Filtrado" : "Real-time",
        isPositive: true,
        label: isFiltered ? "según filtros aplicados" : "en pipeline activo",
      },
      icon: <Users className="w-5 h-5 text-[#6bd8cb]" />,
      explanation: "Suma total de postulantes registrados en el pipeline global de talentos para los filtros aplicados.",
      formula: "Σ(Candidatos en pipeline vinculados a búsquedas activas)",
    },
    {
      id: "tiempo_asignacion",
      title: "Tiempo de Asignación",
      value: realAllocationTime,
      trend: {
        value: isFiltered ? "Filtrado" : "Promedio",
        isPositive: true, // Reducir tiempo de asignación es una mejora
        label: isFiltered ? "según filtros aplicados" : "promedio mensual",
      },
      icon: <Clock className="w-5 h-5 text-[#6bd8cb]" />,
      explanation: "Promedio en días transcurridos desde la creación de una búsqueda hasta la asignación de candidatos calificados.",
      formula: "Σ(Fecha Asignación - Fecha Creación) / Total Búsquedas Asignadas",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          {...kpi}
          activeHelpId={activeHelpId}
          onToggleHelp={handleToggleHelp}
        />
      ))}
    </div>
  );
}



