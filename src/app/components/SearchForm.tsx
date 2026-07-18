'use client';

import React, { useState, useTransition, useEffect } from "react";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";
import { crearBusquedaAPI, actualizarBusquedaAPI, Busqueda } from "@/actions/busquedas";

interface SearchFormProps {
  onSuccess: (data: any) => void;
  onClose: () => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
  initialData?: Busqueda;
}

export default function SearchForm({ onSuccess, onClose, onSubmittingChange, initialData }: SearchFormProps) {
  // 6 Identity fields state + estadoFase
  const [cliente, setCliente] = useState("");
  const [perfilBusqueda, setPerfilBusqueda] = useState("");
  const [responsableOperativo, setResponsableOperativo] = useState("");
  const [responsableValidacion, setResponsableValidacion] = useState("");
  const [fechaInicioObjetivo, setFechaInicioObjetivo] = useState("");
  const [estadoFase, setEstadoFase] = useState("preparacion_previa");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

  // Synchronize dynamic updates when opening/closed or switching selected rows
  useEffect(() => {
    if (initialData) {
      setCliente(initialData.cliente || "");
      setPerfilBusqueda(initialData.perfil_busqueda || "");
      setResponsableOperativo(initialData.responsable_operativo || "");
      setResponsableValidacion(initialData.responsable_validacion || "");
      
      // Parse ISO date sequence for HTML5 date input compatibility
      let dateVal = "";
      if (initialData.fecha_inicio_objetivo) {
        dateVal = initialData.fecha_inicio_objetivo.split("T")[0];
      }
      setFechaInicioObjetivo(dateVal);
      setEstadoFase(initialData.estado_fase || "preparacion_previa");
    } else {
      setCliente("");
      setPerfilBusqueda("");
      setResponsableOperativo("");
      setResponsableValidacion("");
      setFechaInicioObjetivo("");
      setEstadoFase("preparacion_previa");
    }
    setFeedback(null);
  }, [initialData]);

  // Synchronize loading transitions back to slideover component
  useEffect(() => {
    onSubmittingChange(isPending);
  }, [isPending, onSubmittingChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente || !perfilBusqueda || !responsableOperativo || !responsableValidacion || !fechaInicioObjetivo) {
      setFeedback({
        type: "error",
        message: "Por favor completa todos los campos obligatorios."
      });
      return;
    }

    setFeedback(null);

    const payload = {
      cliente,
      perfil_busqueda: perfilBusqueda,
      estado_fase: estadoFase,
      responsable_operativo: responsableOperativo,
      responsable_validacion: responsableValidacion,
      fecha_inicio_objetivo: fechaInicioObjetivo
    };

    startTransition(async () => {
      try {
        let result;
        if (initialData?.id) {
          result = await actualizarBusquedaAPI(initialData.id, payload);
        } else {
          result = await crearBusquedaAPI(payload);
        }

        const expectedSuccessStatus = initialData?.id ? 200 : 201;

        if (result.status === expectedSuccessStatus) {
          setFeedback({
            type: "success",
            message: result.message
          });
          // Short delay before closing to show feedback
          setTimeout(() => {
            onSuccess(result.data || payload);
          }, 1500);
        } else if (result.status === 207) {
          setFeedback({
            type: "warning",
            message: result.message
          });
          // Longer delay for warning awareness
          setTimeout(() => {
            onSuccess(result.data || payload);
          }, 3000);
        } else {
          setFeedback({
            type: "error",
            message: result.message
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: "Error técnico: Falla inesperada al enviar datos al servidor analítico Cloud Run."
        });
      }
    });
  };

  return (
    <form
      id="search-form"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Informative helper banner */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-xs text-[#6bd8cb]">
        <Info className="w-5 h-5 shrink-0" />
        <p className="leading-relaxed">
          {initialData 
            ? "Modo de edición activado. Realice los cambios necesarios y presione actualizar para enviarlos al servidor analítico."
            : "Los campos a continuación estructuran la cédula de identidad del proceso. Estos datos serán transferidos vía servicio REST a la base analítica."
          }
        </p>
      </div>

      {/* Campo: Cliente */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
          Cliente (España) <span className="text-red-400">*</span>
        </label>
        <select
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          disabled={isPending}
          required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
        >
          <option value="" className="bg-[#15181a] text-[#879391]">Selecciona un cliente...</option>
          <option value="Telefónica S.A." className="bg-[#15181a] text-white">Telefónica S.A. (Madrid)</option>
          <option value="Banco Santander" className="bg-[#15181a] text-white">Banco Santander (Madrid)</option>
          <option value="Inditex S.A." className="bg-[#15181a] text-white">Inditex S.A. (Arteixo)</option>
          <option value="Iberdrola S.A." className="bg-[#15181a] text-white">Iberdrola S.A. (Bilbao)</option>
          <option value="Mercadona S.A." className="bg-[#15181a] text-white">Mercadona S.A. (Valencia)</option>
          <option value="SEAT S.A." className="bg-[#15181a] text-white">SEAT S.A. (Barcelona)</option>
          <option value="Amadeus España" className="bg-[#15181a] text-white">Amadeus España (Madrid)</option>
        </select>
      </div>

      {/* Campo: Perfil de Búsqueda */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
          Perfil de Búsqueda (Puesto) <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={perfilBusqueda}
          onChange={(e) => setPerfilBusqueda(e.target.value)}
          placeholder="Ej. Cloud Security Expert"
          disabled={isPending}
          required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50"
        />
      </div>

      {/* Campo: Estado de Fase */}
      <div className="flex flex-col">
        <label className={`text-[10px] font-bold tracking-wider uppercase mb-1.5 ${
          initialData ? "text-[#c4c1fb]" : "text-[#879391]"
        }`}>
          {initialData ? "Estado de Fase (Editable)" : "Estado Inicial de Fase"}
        </label>
        {initialData ? (
          <select
            value={estadoFase}
            onChange={(e) => setEstadoFase(e.target.value)}
            disabled={isPending}
            required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
          >
            <option value="preparacion_previa" className="bg-[#15181a] text-white">Preparación Previa</option>
            <option value="evaluacion_tecnica" className="bg-[#15181a] text-white">Evaluación Técnica</option>
            <option value="revision_cliente" className="bg-[#15181a] text-white">Revisión de Cliente</option>
            <option value="oferta_cierre" className="bg-[#15181a] text-white">Oferta & Cierre</option>
          </select>
        ) : (
          <>
            <input
              type="text"
              value="preparacion_previa"
              disabled
              className="bg-white/[0.02] border border-white/5 text-[#879391] rounded-xl px-4 py-2.5 text-xs font-mono select-none"
            />
            <span className="text-[9px] text-[#879391] mt-1 shrink-0">
              * Campo autogenerado por ciclo de vida operativo.
            </span>
          </>
        )}
      </div>

      {/* Campo: Responsable Operativo */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
          Responsable Operativo <span className="text-red-400">*</span>
        </label>
        <select
          value={responsableOperativo}
          onChange={(e) => setResponsableOperativo(e.target.value)}
          disabled={isPending}
          required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
        >
          <option value="" className="bg-[#15181a] text-[#879391]">Selecciona responsable operativo...</option>
          <option value="Edith Medina" className="bg-[#15181a] text-white">Edith Medina</option>
          <option value="Alejandro López" className="bg-[#15181a] text-white">Alejandro López</option>
          <option value="Javier García" className="bg-[#15181a] text-white">Javier García</option>
          <option value="Montserrat Rivas" className="bg-[#15181a] text-white">Montserrat Rivas</option>
        </select>
      </div>

      {/* Campo: Responsable Validación */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
          Responsable Validación <span className="text-red-400">*</span>
        </label>
        <select
          value={responsableValidacion}
          onChange={(e) => setResponsableValidacion(e.target.value)}
          disabled={isPending}
          required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
        >
          <option value="" className="bg-[#15181a] text-[#879391]">Selecciona validador...</option>
          <option value="Celeste" className="bg-[#15181a] text-white">Celeste</option>
          <option value="Beatriz Ruiz" className="bg-[#15181a] text-white">Beatriz Ruiz</option>
          <option value="Patricia Marcos" className="bg-[#15181a] text-white">Patricia Marcos</option>
          <option value="Carlos Herrera" className="bg-[#15181a] text-white">Carlos Herrera</option>
        </select>
      </div>

      {/* Campo: Fecha Inicio Objetivo */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
          Fecha Inicio Objetivo <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={fechaInicioObjetivo}
          onChange={(e) => setFechaInicioObjetivo(e.target.value)}
          disabled={isPending}
          required
          style={{ colorScheme: "dark" }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
        />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex gap-2.5 p-3 rounded-xl border text-xs leading-relaxed transition-all ${
            feedback.type === "success"
              ? "border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-[#6bd8cb]"
              : feedback.type === "warning"
              ? "border-amber-500/20 bg-amber-500/5 text-amber-400"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hidden submit trigger */}
      <button type="submit" className="hidden" />
    </form>
  );
}
