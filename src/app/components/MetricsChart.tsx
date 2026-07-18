'use client';

import React, { useEffect, useState } from "react";
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

const data = [
  { name: "Ene", busquedas: 12, candidatos: 240 },
  { name: "Feb", busquedas: 15, candidatos: 310 },
  { name: "Mar", busquedas: 18, candidatos: 410 },
  { name: "Abr", busquedas: 14, candidatos: 350 },
  { name: "May", busquedas: 22, candidatos: 530 },
  { name: "Jun", busquedas: 24, candidatos: 620 }
];

export default function MetricsChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-96 flex items-center justify-center backdrop-blur-md">
        <span className="text-[#879391] text-sm font-medium animate-pulse">Cargando métricas...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden backdrop-blur-md min-h-[384px] flex flex-col justify-between">
      <div className="space-y-1 mb-6">
        <h3 className="text-lg font-bold text-white">Métricas Históricas</h3>
        <p className="text-xs text-[#879391]">
          Búsquedas de personal y volumen de postulaciones procesadas (Simulación BigQuery)
        </p>
      </div>

      <div className="w-full flex-grow h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientBusquedas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6bd8cb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6bd8cb" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradientCandidatos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c4c1fb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#c4c1fb" stopOpacity={0.1} />
              </linearGradient>
            </defs>

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
              name="Búsquedas Activas"
              dataKey="busquedas"
              fill="url(#gradientBusquedas)"
              radius={[4, 4, 0, 0]}
            />
            
            <Bar
              name="Postulantes Nuevos"
              dataKey="candidatos"
              fill="url(#gradientCandidatos)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
