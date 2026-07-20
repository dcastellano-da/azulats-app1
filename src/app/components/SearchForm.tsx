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
      link_job_description: linkJobDescription.trim()
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
      {/* Informative helper banner */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-xs text-[#6bd8cb]">
        <Info className="w-5 h-5 shrink-0" />
        <p className="leading-relaxed">
          {initialData 
            ? "Modo de edición activado. Solo se permite actualizar el Estado de Fase y la Prioridad debido a políticas analíticas del backend."
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
              disabled={isPending || !!initialData}
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
              disabled={isPending || !!initialData}
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
            disabled={isPending || !!initialData}
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
            disabled={isPending || !!initialData}
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
              disabled={isPending || !!initialData}
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
              disabled={isPending || !!initialData}
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
              disabled={isPending || !!initialData}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#6bd8cb] focus:outline-none transition-all placeholder-[#879391] font-medium disabled:opacity-50 disabled:bg-white/[0.02]"
            />
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

      {/* Hidden submit trigger */}
      <button type="submit" className="hidden" />
    </form>
  );
}
