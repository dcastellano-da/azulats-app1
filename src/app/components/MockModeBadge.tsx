import React from "react";
import { AlertTriangle } from "lucide-react";

export default function MockModeBadge() {
  if (process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
    return null;
  }

  return (
    <div
      data-testid="mock-mode-badge"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10 animate-pulse select-none"
      title="Entorno configurado en MODO MOCK: Se retornan datos estáticos locales sin realizar llamadas HTTP de red."
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>⚠️ MOCKS ACTIVOS</span>
    </div>
  );
}
