'use client';

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { Candidato } from "@/actions/candidatos";

interface MetricsChartProps {
  candidatos?: Candidato[];
}

export default function MetricsChart({ candidatos = [] }: MetricsChartProps) {
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getWeekInfo = (date: Date) => {
    const monthsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monday = new Date(date);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const target = new Date(monday.valueOf());
    const dayNr = (monday.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNum = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);

    const dayNum = monday.getDate().toString().padStart(2, '0');
    const monthStr = monthsShort[monday.getMonth()];
    
    return {
      key: monday.toISOString().substring(0, 10),
      label: `Sem ${weekNum} (${dayNum} ${monthStr})`,
      timestamp: monday.getTime()
    };
  };

  const chartData = useMemo(() => {
    if (!candidatos || candidatos.length === 0) {
      return [];
    }

    const weekMap: Record<string, { label: string; timestamp: number; categories: Record<string, number> }> = {};

    candidatos.forEach((cand) => {
      const dateStr = cand.createdAt || (cand as any).fecha_creacion || (cand as any).created_at || cand.updatedAt;
      if (!dateStr) return;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      const weekInfo = getWeekInfo(d);

      if (!weekMap[weekInfo.key]) {
        weekMap[weekInfo.key] = {
          label: weekInfo.label,
          timestamp: weekInfo.timestamp,
          categories: {
            "Directo ATS": 0,
            "LinkedIn InMail": 0,
            "Sourcing IA": 0,
            "Referido Interno": 0
          }
        };
      }

      const rawOrigen = (cand.origen || (cand as any).canal_ingreso || "Directo ATS").toLowerCase();
      let category = "Directo ATS";
      if (rawOrigen.includes("linkedin") || rawOrigen.includes("inmail")) {
        category = "LinkedIn InMail";
      } else if (rawOrigen.includes("ia") || rawOrigen.includes("sourcing") || rawOrigen.includes("boolean")) {
        category = "Sourcing IA";
      } else if (rawOrigen.includes("referido") || rawOrigen.includes("interno")) {
        category = "Referido Interno";
      }

      weekMap[weekInfo.key].categories[category] = (weekMap[weekInfo.key].categories[category] || 0) + 1;
    });

    // Sort chronologically by Monday timestamp
    const sortedKeys = Object.keys(weekMap).sort(
      (a, b) => weekMap[a].timestamp - weekMap[b].timestamp
    );

    return sortedKeys.map((wKey) => ({
      name: weekMap[wKey].label,
      ...weekMap[wKey].categories
    }));
  }, [candidatos]);

  if (!mounted) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-96 flex items-center justify-center backdrop-blur-md">
        <span className="text-[#879391] text-sm font-medium animate-pulse">Cargando métricas de postulantes...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden backdrop-blur-md min-h-[384px] flex flex-col justify-between">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Evolución Semanal de Postulantes por Origen</h3>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
              title="Ver criterio y fórmula de cálculo"
            >
              ?
            </button>
          </div>
          <p className="text-xs text-[#879391]">
            Ingresos semanales en el padrón global desglosados por Origen del Perfil (Global Padrón)
          </p>
        </div>
      </div>

      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-5 rounded-2xl flex flex-col justify-between z-30 border border-white/10 animate-fadeIn">
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-[#6bd8cb] uppercase tracking-wider">Criterio - Evolución Semanal de Postulantes por Origen</span>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-white/40 hover:text-white font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Muestra la evolución semanal de postulantes ingresados en la base global de talentos, desglosados por su Origen del Perfil (campo "origen": Directo ATS, LinkedIn InMail, Sourcing IA, Referido Interno).
            </p>
            <p className="text-[10px] text-[#c4c1fb] font-mono tracking-tight pt-1">
              Nota: No aplican filtros de cliente ni de búsqueda al pertenecer al padrón global de postulantes (fuera de la colección pipeline).
            </p>
          </div>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="w-full flex-grow h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-4 text-center">
          <p className="text-xs text-[#879391]">No hay postulantes registrados con fecha de ingreso para generar la evolución semanal.</p>
        </div>
      ) : (
        <div className="w-full flex-grow h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#ffffff" strokeOpacity={0.06} strokeDasharray="3 3" vertical={false} />
              
              <XAxis
                dataKey="name"
                stroke="#879391"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              
              <YAxis
                stroke="#879391"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-5}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(16, 20, 21, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                }}
                labelStyle={{ color: "#ffffff", fontWeight: "bold", fontSize: "12px" }}
                itemStyle={{ fontSize: "12px" }}
              />
              
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#c4c1fb" }}
              />
              
              <Bar
                name="Directo ATS"
                dataKey="Directo ATS"
                stackId="a"
                fill="#6bd8cb"
              />

              <Bar
                name="LinkedIn InMail"
                dataKey="LinkedIn InMail"
                stackId="a"
                fill="#c4c1fb"
              />

              <Bar
                name="Sourcing IA"
                dataKey="Sourcing IA"
                stackId="a"
                fill="#9b5de5"
              />

              <Bar
                name="Referido Interno"
                dataKey="Referido Interno"
                stackId="a"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}

