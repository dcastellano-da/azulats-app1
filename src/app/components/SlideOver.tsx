'use client';

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  isSubmitting?: boolean;
  submitLabel?: string;
  formId?: string;
}

export default function SlideOver({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  isSubmitting = false, 
  submitLabel,
  formId = "search-form"
}: SlideOverProps) {
  // Prevent background scroll when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop overlay */}
      <div
        className={`absolute inset-0 bg-[#000000]/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`absolute top-0 right-0 h-full w-full max-w-lg bg-[#15181a] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#101415]/80 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <p className="text-[11px] text-[#879391]">Completa los campos obligatorios para iniciar el proceso</p>
          </div>
          
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`w-9 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-[#c4c1fb] transition-all ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:text-white cursor-pointer"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 text-white">
          {children || (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 text-center bg-white/5">
              <span className="text-xs text-[#879391] uppercase tracking-wider font-bold mb-1">
                Contenedor Vacío
              </span>
              <p className="text-xs text-[#879391] max-w-xs">
                El formulario del Maestro de Búsquedas se integrará en el siguiente sprint de desarrollo.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4.5 border-t border-white/10 bg-[#101415]/80 backdrop-blur-md flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-[#c4c1fb]/20 bg-white/5 transition-all ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"
            }`}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 transition-all shadow-md ${
              isSubmitting ? "opacity-50 cursor-not-allowed bg-opacity-70" : "cursor-pointer"
            }`}
          >
            {isSubmitting ? "Guardando..." : (submitLabel || "Guardar Búsqueda")}
          </button>
        </div>
      </aside>
    </div>
  );
}
