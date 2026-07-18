'use client';

import React from "react";
import { Briefcase, Users, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: React.ReactNode;
}

function KpiCard({ title, value, trend, icon }: KpiCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 glow-effect relative overflow-hidden backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-xs font-bold text-[#c4c1fb] uppercase tracking-wider">{title}</p>
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

        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
          {icon}
        </div>
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-[#0d9488]/5 to-transparent rounded-bl-full pointer-events-none"></div>
    </div>
  );
}

export default function KpiCards() {
  const kpis = [
    {
      title: "Búsquedas Activas",
      value: "24",
      trend: {
        value: "+14.3%",
        isPositive: true,
        label: "vs mes anterior",
      },
      icon: <Briefcase className="w-5 h-5 text-[#6bd8cb]" />,
    },
    {
      title: "Candidatos en Bandeja",
      value: "1,428",
      trend: {
        value: "+8.1%",
        isPositive: true,
        label: "vs semana pasada",
      },
      icon: <Users className="w-5 h-5 text-[#6bd8cb]" />,
    },
    {
      title: "Tiempo de Asignación",
      value: "18.2 días",
      trend: {
        value: "-12.5%",
        isPositive: true, // Reducir tiempo de asignación es una mejora
        label: "promedio mensual",
      },
      icon: <Clock className="w-5 h-5 text-[#6bd8cb]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => (
        <KpiCard key={index} {...kpi} />
      ))}
    </div>
  );
}
