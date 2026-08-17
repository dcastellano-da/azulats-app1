'use client';

import React from 'react';
import { AlignJustify, Menu } from 'lucide-react';

export type DensityMode = 'compact' | 'expanded';

interface DensitySelectorProps {
  density: DensityMode;
  onChange: (density: DensityMode) => void;
}

export default function DensitySelector({ density, onChange }: DensitySelectorProps) {
  return (
    <div className="flex items-center gap-2 select-none animate-fadeIn">
      <span className="text-xs text-[#c4c1fb] font-medium whitespace-nowrap">
        Densidad:
      </span>
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => onChange('compact')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            density === 'compact'
              ? 'bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10'
              : 'text-[#879391] hover:text-white font-medium'
          }`}
          title="Visualización densa (8-12 candidatos por página)"
        >
          <AlignJustify className="w-3.5 h-3.5" />
          <span>Compacta</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('expanded')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            density === 'expanded'
              ? 'bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10'
              : 'text-[#879391] hover:text-white font-medium'
          }`}
          title="Desglose vertical completo de criterios"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Expandida</span>
        </button>
      </div>
    </div>
  );
}
