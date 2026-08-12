'use client';

import React, { useState, useTransition, useEffect } from "react";
import { Info, CheckCircle2, AlertCircle, Plus, Trash2, AlertTriangle } from "lucide-react";
import { crearBusquedaAPI, actualizarBusquedaAPI, Busqueda } from "@/actions/busquedas";
import { CriterioScreening } from "@/types/screening";

interface SearchFormProps {
  onSuccess: (data: any) => void;
  onClose: () => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
  initialData?: Busqueda;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  layoutTwoColumns?: boolean;
}

export default function SearchForm({ 
  onSuccess, 
  onClose, 
  onSubmittingChange, 
  initialData,
  showSubmitButton = false,
  submitButtonText = "Guardar Búsqueda",
  layoutTwoColumns
}: SearchFormProps) {
  const isTwoColumns = layoutTwoColumns ?? showSubmitButton;
  // 6 Identity fields state + estadoFase
  const [cliente, setCliente] = useState("");
  const [perfilBusqueda, setPerfilBusqueda] = useState("");
  const [responsableOperativo, setResponsableOperativo] = useState("");
  const [responsableValidacion, setResponsableValidacion] = useState("");
  const [fechaInicioObjetivo, setFechaInicioObjetivo] = useState("");
  const [estadoFase, setEstadoFase] = useState("Abierta");

  // Nuevos campos del backend
  const [idBusqueda, setIdBusqueda] = useState("");
  const [seniority, setSeniority] = useState("");
  const [skillsExcluyentes, setSkillsExcluyentes] = useState("");
  const [skillsDeseables, setSkillsDeseables] = useState("");
  const [nivelInglesReq, setNivelInglesReq] = useState("");
  const [modalidad, setModalidad] = useState("Remoto");
  const [presupuestoMax, setPresupuestoMax] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [linkJobDescription, setLinkJobDescription] = useState("");
  const [criteriosScreening, setCriteriosScreening] = useState<CriterioScreening[]>([]);

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
      setEstadoFase(initialData.estado_fase || "Abierta");

      // Vincular nuevos campos
      setIdBusqueda(initialData.id_busqueda || initialData.id || "");
      setSeniority(initialData.seniority || "");
      setSkillsExcluyentes(Array.isArray(initialData.skills_excluyentes) ? initialData.skills_excluyentes.join(", ") : "");
      setSkillsDeseables(Array.isArray(initialData.skills_deseables) ? initialData.skills_deseables.join(", ") : "");
      setNivelInglesReq(initialData.nivel_ingles_req || "");
      setModalidad(initialData.modalidad || "Remoto");
      setPresupuestoMax(initialData.presupuesto_max || "");
      setPrioridad(initialData.prioridad || "Normal");
      setLinkJobDescription(initialData.link_job_description || "");
      
      const incomingCriterios = (Array.isArray(initialData.criterios_screening) && initialData.criterios_screening.length > 0)
        ? initialData.criterios_screening
        : (Array.isArray((initialData as any).criterios) ? (initialData as any).criterios : (Array.isArray(initialData.criterios_screening) ? initialData.criterios_screening : []));

      setCriteriosScreening(incomingCriterios);
    } else {
      setCliente("");
      setPerfilBusqueda("");
      setResponsableOperativo("");
      setResponsableValidacion("");
      setFechaInicioObjetivo("");
      setEstadoFase("Abierta");

      setIdBusqueda("");
      setSeniority("");
      setSkillsExcluyentes("");
      setSkillsDeseables("");
      setNivelInglesReq("");
      setModalidad("Remoto");
      setPresupuestoMax("");
      setPrioridad("Normal");
      setLinkJobDescription("");
      setCriteriosScreening([]);
    }
    setFeedback(null);
  }, [initialData]);

  // Synchronize loading transitions back to slideover component
  useEffect(() => {
    onSubmittingChange(isPending);
  }, [isPending, onSubmittingChange]);

  const handleAddCriterio = () => {
    if (criteriosScreening.length >= 5) return;
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `crit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setCriteriosScreening(prev => [
      ...prev,
      { id: newId, pregunta: "", tipo: "deseable", peso: 20 }
    ]);
  };

  const handleUpdateCriterio = (index: number, updatedField: Partial<CriterioScreening>) => {
    setCriteriosScreening(prev => {
      const copy = [...prev];
      const current = copy[index];
      if (!current) return prev;
      const nuevoTipo = updatedField.tipo !== undefined ? updatedField.tipo : current.tipo;
      const nuevoPeso = nuevoTipo === "knockout" ? 0 : (updatedField.peso !== undefined ? updatedField.peso : (current.tipo === "knockout" ? 20 : current.peso));
      
      copy[index] = {
        ...current,
        ...updatedField,
        id: current.id, // Preservar UUID original
        tipo: nuevoTipo,
        peso: nuevoPeso
      };
      return copy;
    });
  };

  const handleRemoveCriterio = (index: number) => {
    setCriteriosScreening(prev => prev.filter((_, idx) => idx !== index));
  };

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
      fecha_inicio_objetivo: fechaInicioObjetivo,

      // Mapear nuevos campos
      id_busqueda: idBusqueda.trim() || undefined,
      seniority: seniority.trim(),
      skills_excluyentes: skillsExcluyentes ? skillsExcluyentes.split(",").map(s => s.trim()).filter(Boolean) : [],
      skills_deseables: skillsDeseables ? skillsDeseables.split(",").map(s => s.trim()).filter(Boolean) : [],
      nivel_ingles_req: nivelInglesReq.trim(),
      modalidad,
      presupuesto_max: presupuestoMax.trim(),
      prioridad,
      link_job_description: linkJobDescription.trim(),
      criterios_screening: criteriosScreening.map(c => ({
        ...c,
        peso: c.tipo === "knockout" ? 0 : Number(c.peso || 0)
      }))
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
      className="space-y-6"
    >
      <div className={isTwoColumns ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" : "space-y-6"}>
        {/* LEFT COLUMN: Wider (col-span-7) - Sections 1 to 4 */}
        <div className={isTwoColumns ? "lg:col-span-7 space-y-6" : "space-y-6"}>
          {/* Informative helper banner */}
          <div className="flex gap-2.5 p-3 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-xs text-[#6bd8cb]">
            <Info className="w-5 h-5 shrink-0" />
            <p className="leading-relaxed">
              {initialData 
                ? "Modo de edición activado. Puede actualizar el Estado de Fase, Prioridad, Responsables, Skills, Nivel de Inglés, Modalidad, Presupuesto y Criterios de Screening."
                : "Estructure la ficha técnica del proceso. Al guardar, se creará el registro jerárquico correspondiente."
              }
            </p>
          </div>

          {/* BLOQUE 1: IDENTIFICACIÓN */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-[11px] font-bold text-[#6bd8cb] tracking-wider uppercase">
              1. Identificación
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Código Búsqueda
                </label>
                <input
                  type="text"
                  value={idBusqueda}
                  onChange={(e) => setIdBusqueda(e.target.value)}
                  placeholder="Ej. REQ-MOCK-001"
                  disabled={isPending || !!initialData}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  CLIENTE <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nombre del cliente"
                  disabled={isPending || !!initialData}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Responsable Operativo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={responsableOperativo}
                  onChange={(e) => setResponsableOperativo(e.target.value)}
                  placeholder="Ej. Edith Medina"
                  disabled={isPending}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Fecha Apertura <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={fechaInicioObjetivo}
                  onChange={(e) => setFechaInicioObjetivo(e.target.value)}
                  disabled={isPending || !!initialData}
                  required
                  style={{ colorScheme: "dark" }}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PERFIL TÉCNICO */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-[11px] font-bold text-[#6bd8cb] tracking-wider uppercase">
              2. Perfil Técnico
            </h3>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                Rol/Puesto Solicitado <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={perfilBusqueda}
                onChange={(e) => setPerfilBusqueda(e.target.value)}
                placeholder="Ej. Cloud Security Expert"
                disabled={isPending || !!initialData}
                required
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Seniority
                </label>
                <input
                  type="text"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  placeholder="Ej. Senior, Lead"
                  disabled={isPending || !!initialData}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Nivel Inglés Req.
                </label>
                <input
                  type="text"
                  value={nivelInglesReq}
                  onChange={(e) => setNivelInglesReq(e.target.value)}
                  placeholder="Ej. B2 Conversacional"
                  disabled={isPending}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                Skills Excluyentes (separadas por comas)
              </label>
              <input
                type="text"
                value={skillsExcluyentes}
                onChange={(e) => setSkillsExcluyentes(e.target.value)}
                placeholder="Ej. Node.js, Jest, GCP"
                disabled={isPending}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                Skills Deseables (separadas por comas)
              </label>
              <input
                type="text"
                value={skillsDeseables}
                onChange={(e) => setSkillsDeseables(e.target.value)}
                placeholder="Ej. AWS, Docker, Kubernetes"
                disabled={isPending}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
              />
            </div>
          </div>

          {/* BLOQUE 3: CONDICIONES */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-[11px] font-bold text-[#6bd8cb] tracking-wider uppercase">
              3. Condiciones de Contratación
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Modalidad
                </label>
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  disabled={isPending}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                >
                  <option value="Remoto" className="bg-[#15181a] text-white">Remoto</option>
                  <option value="Híbrido" className="bg-[#15181a] text-white">Híbrido</option>
                  <option value="Presencial" className="bg-[#15181a] text-white">Presencial</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Responsable Validación <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={responsableValidacion}
                  onChange={(e) => setResponsableValidacion(e.target.value)}
                  placeholder="Ej. Celeste"
                  disabled={isPending || !!initialData}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 4: ESTADO Y SLA */}
          <div className="space-y-4 pt-4 border-t border-white/10 pb-2">
            <h3 className="text-[11px] font-bold text-[#6bd8cb] tracking-wider uppercase">
              4. Estado y SLA
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Estado de Fase
                </label>
                <select
                  value={estadoFase}
                  onChange={(e) => setEstadoFase(e.target.value)}
                  disabled={isPending}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                >
                  <option value="Abierta" className="bg-[#15181a] text-white">Abierta</option>
                  <option value="Pausada" className="bg-[#15181a] text-white">Pausada</option>
                  <option value="Cerrada" className="bg-[#15181a] text-white">Cerrada</option>
                  <option value="preparacion_previa" className="bg-[#15181a] text-white">Preparación Previa</option>
                  <option value="evaluacion_tecnica" className="bg-[#15181a] text-white">Evaluación Técnica</option>
                  <option value="revision_cliente" className="bg-[#15181a] text-white">Revisión de Cliente</option>
                  <option value="oferta_cierre" className="bg-[#15181a] text-white">Oferta & Cierre</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Prioridad <span className="text-[#6bd8cb]">*</span>
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                  disabled={isPending}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50"
                >
                  <option value="Baja" className="bg-[#15181a] text-white">Baja</option>
                  <option value="Normal" className="bg-[#15181a] text-white">Normal</option>
                  <option value="Alta" className="bg-[#15181a] text-white">Alta</option>
                  <option value="Crítica" className="bg-[#15181a] text-white">Crítica</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Presupuesto Máx.
                </label>
                <input
                  type="text"
                  value={presupuestoMax}
                  onChange={(e) => setPresupuestoMax(e.target.value)}
                  placeholder="Ej. 60K EUR"
                  disabled={isPending}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
                  Link Job Description
                </label>
                <input
                  type="url"
                  value={linkJobDescription}
                  onChange={(e) => setLinkJobDescription(e.target.value)}
                  placeholder="Ej. https://docs.google.com/..."
                  disabled={isPending}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Narrower (col-span-5) - Section 5 (Criterios de Screening) */}
        <div className={isTwoColumns ? "lg:col-span-5 space-y-6" : "space-y-6"}>
          {/* BLOQUE 5: CRITERIOS DE SCREENING (IA CHECKLIST - MÁX 5) */}
          <div className="space-y-4 pt-2 border-t lg:border-t-0 border-white/10 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold text-[#6bd8cb] tracking-wider uppercase">
                  5. Criterios de Screening (Máximo 5)
                </h3>
                <p className="text-[10px] text-[#879391] mt-0.5">
                  Defina las preguntas de descarte o evaluación ponderada para la IA (Gemini 2.5 Flash).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCriterio}
                disabled={isPending || criteriosScreening.length >= 5}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20 hover:bg-[#6bd8cb]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar ({criteriosScreening.length}/5)</span>
              </button>
            </div>

            {/* Indicador de suma de pesos — solo visible cuando hay criterios */}
            {criteriosScreening.length > 0 && (() => {
              const sumaPeso = criteriosScreening
                .filter(c => c.tipo === "deseable")
                .reduce((acc, c) => acc + (c.peso || 0), 0);
              const hasDeseable = criteriosScreening.some(c => c.tipo === "deseable");
              const isExact = sumaPeso === 100;
              const isOver  = sumaPeso > 100;
              // Colors
              const colorBg     = isExact ? "bg-emerald-500/10 border-emerald-500/25" : isOver ? "bg-red-500/10 border-red-500/25" : "bg-amber-500/10 border-amber-500/20";
              const colorBadge  = isExact ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : isOver ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30";
              const colorMsg    = isExact ? "text-emerald-300" : isOver ? "text-red-300" : "text-amber-300";
              const mensaje     = isExact
                ? "✓ Los pesos ponderados suman exactamente 100. ¡Configuración óptima para el scoring de IA!"
                : isOver
                ? `⚠ Los pesos suman ${sumaPeso} pts, que supera el máximo de 100. Reduce el peso de algún criterio.`
                : hasDeseable
                ? `Los pesos "Deseable" suman ${sumaPeso} pts. Se recomienda que la suma sea 100 para un scoring equilibrado.`
                : "Aún no hay criterios de tipo Deseable. Los criterios Knockout no puntúan.";

              return (
                <div className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] leading-relaxed ${colorBg}`}>
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" style={{ color: isExact ? "#6ee7b7" : isOver ? "#fca5a5" : "#fcd34d" }} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${colorMsg}`}>Suma de pesos ponderados:</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${colorBadge}`}>
                        {sumaPeso} / 100 pts
                      </span>
                    </div>
                    <p className={`${colorMsg} opacity-90`}>{mensaje}</p>
                  </div>
                </div>
              );
            })()}

            {initialData && (
              <div className="flex gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <p className="leading-relaxed">
                  <strong>Atención:</strong> Al modificar los criterios de screening en esta búsqueda activa, los candidatos en el pipeline podrían requerir ser re-evaluados con IA para actualizar su semáforo.
                </p>
              </div>
            )}

            {criteriosScreening.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-[#879391]">
                No hay criterios de screening configurados. Haz clic en "Agregar" para agregar hasta 5 reglas.
              </div>
            ) : (
              <div className="space-y-3">
                {criteriosScreening.map((crit, idx) => (
                  <div key={crit.id || idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#c4c1fb]">Criterio #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterio(idx)}
                        disabled={isPending}
                        className="text-red-400 hover:text-red-300 text-xs p-1 rounded hover:bg-red-500/10 transition-all"
                        title="Eliminar criterio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-[#879391] mb-1">Pregunta / Condición a evaluar</label>
                      <input
                        type="text"
                        value={crit.pregunta}
                        onChange={(e) => handleUpdateCriterio(idx, { pregunta: e.target.value })}
                        placeholder="Ej. ¿Tiene al menos 5 años de experiencia en logística?"
                        disabled={isPending}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] text-[#879391] mb-1">Tipo de Regla</label>
                        <select
                          value={crit.tipo}
                          onChange={(e) => handleUpdateCriterio(idx, { tipo: e.target.value as "knockout" | "deseable" })}
                          disabled={isPending}
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="deseable" className="bg-[#15181a]">Deseable (Ponderado)</option>
                          <option value="knockout" className="bg-[#15181a]">Knockout (Excluyente)</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] text-[#879391] mb-1">Peso / Puntaje</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={crit.tipo === "knockout" ? 0 : crit.peso}
                          onChange={(e) => handleUpdateCriterio(idx, { peso: parseInt(e.target.value) || 0 })}
                          disabled={isPending || crit.tipo === "knockout"}
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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

      {/* Action buttons (when rendered in full page mode) */}
      {showSubmitButton && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-[#c4c1fb] hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#6bd8cb] text-[#101415] font-extrabold text-xs shadow-lg shadow-[#0d9488]/20 hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#101415] border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <span>{submitButtonText}</span>
            )}
          </button>
        </div>
      )}

      {/* Hidden submit trigger */}
      <button type="submit" className="hidden" />
    </form>
  );
}
