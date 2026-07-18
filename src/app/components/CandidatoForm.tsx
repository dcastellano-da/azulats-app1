'use client';

import React, { useState, useTransition, useEffect, useRef } from "react";
import { Info, CheckCircle2, AlertCircle, Upload, FileText, Trash2 } from "lucide-react";
import { crearCandidatoAPI } from "@/actions/candidatos";

interface CandidatoFormProps {
  onSuccess: (data: any) => void;
  onClose: () => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
}

export default function CandidatoForm({ onSuccess, onClose, onSubmittingChange }: CandidatoFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [puesto, setPuesto] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Synchronize loading transitions back to slideover component
  useEffect(() => {
    onSubmittingChange(isPending);
  }, [isPending, onSubmittingChange]);

  const validateFile = (selected?: File) => {
    if (!selected) return;
    
    // Weight boundary check: size > 5MB
    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setFileError("El archivo supera el tamaño máximo permitido de 5MB.");
      return;
    }
    
    // Type checking: PDF only
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setFileError("Formato de archivo inválido. Solo se admiten currículums en formato PDF.");
      return;
    }

    setFile(selected);
    setFileError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    validateFile(selected);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreCompleto || !email || !puesto) {
      setFeedback({
        type: "error",
        message: "Por favor completa todos los campos obligatorios."
      });
      return;
    }

    if (!file) {
      setFeedback({
        type: "error",
        message: "Debes cargar un archivo de currículum (PDF) para registrar al candidato."
      });
      return;
    }

    if (!aceptaPrivacidad) {
      setFeedback({
        type: "error",
        message: "Falta el consentimiento: Debe aceptar la política de privacidad y tratamiento de datos."
      });
      return;
    }

    setFeedback(null);

    const formData = new FormData();
    formData.append("nombre_completo", nombreCompleto);
    formData.append("email", email);
    formData.append("puesto", puesto);
    formData.append("linkedin_url", linkedinUrl);
    formData.append("acepta_privacidad", aceptaPrivacidad ? "true" : "false");
    formData.append("cv", file);

    startTransition(async () => {
      try {
        const result = await crearCandidatoAPI(formData);

        if (result.success && result.status === 201) {
          setFeedback({
            type: "success",
            message: result.message
          });
          // Short delay showing response before close
          setTimeout(() => {
            onSuccess(result.data);
          }, 1500);
        } else {
          // Explicit capture of 400 Bad Request messages returned by server/connector
          setFeedback({
            type: "error",
            message: result.message || "Error al procesar registro espontáneo."
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
      id="candidate-form"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Helper Banner */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-xs text-[#6bd8cb]">
        <Info className="w-5 h-5 shrink-0" />
        <p className="leading-relaxed">
          Los campos a continuación estructuran la ficha del candidato manual. Toda la información será procesada y el CV almacenado para indexación visual en España.
        </p>
      </div>

      {/* Campo: Nombre Completo */}
      <div className="relative">
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder=" "
          disabled={isPending}
          required
          autoFocus
          className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all placeholder-transparent font-medium disabled:opacity-50"
        />
        <label className="absolute left-4 top-1.5 text-[9px] font-bold text-[#c4c1fb] tracking-wider uppercase transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-[#879391] peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#6bd8cb]">
          Nombre Completo <span className="text-red-400">*</span>
        </label>
      </div>

      {/* Campo: Correo Electrónico */}
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" "
          disabled={isPending}
          required
          className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all placeholder-transparent font-medium disabled:opacity-50"
        />
        <label className="absolute left-4 top-1.5 text-[9px] font-bold text-[#c4c1fb] tracking-wider uppercase transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-[#879391] peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#6bd8cb]">
          Correo Electrónico <span className="text-red-400">*</span>
        </label>
      </div>

      {/* Campo: Puesto / Perfil */}
      <div className="relative">
        <input
          type="text"
          value={puesto}
          onChange={(e) => setPuesto(e.target.value)}
          placeholder=" "
          disabled={isPending}
          required
          className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all placeholder-transparent font-medium disabled:opacity-50"
        />
        <label className="absolute left-4 top-1.5 text-[9px] font-bold text-[#c4c1fb] tracking-wider uppercase transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-[#879391] peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#6bd8cb]">
          Perfil de Búsqueda / Cargo <span className="text-red-400">*</span>
        </label>
      </div>

      {/* Campo: LinkedIn URL */}
      <div className="relative">
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder=" "
          disabled={isPending}
          className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all placeholder-transparent font-medium disabled:opacity-50"
        />
        <label className="absolute left-4 top-1.5 text-[9px] font-bold text-[#c4c1fb] tracking-wider uppercase transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-[#879391] peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#6bd8cb]">
          Enlace a LinkedIn (Opcional)
        </label>
      </div>

      {/* Dropzone del Archivo CV PDF */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase mb-1.5">
          Currículum Adjunto (PDF, Máx 5MB) <span className="text-red-400">*</span>
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          disabled={isPending}
          className="hidden"
        />

        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`w-full min-h-[120px] rounded-xl border border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? "border-[#6bd8cb] bg-[#6bd8cb]/10" 
                : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
            }`}
          >
            <Upload className="w-8 h-8 text-[#6bd8cb] mb-2 animate-pulse" />
            <p className="text-xs font-bold text-white mb-0.5">Arrastra y suelta tu CV aquí</p>
            <p className="text-[10px] text-[#879391] font-medium">o haz clic para explorar en el ordenador</p>
            {fileError && (
              <div className="mt-3 flex items-center gap-1.5 text-red-400 text-[10px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6bd8cb]/20 flex items-center justify-center text-[#6bd8cb]">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white max-w-[240px] truncate">{file.name}</p>
                <p className="text-[9px] text-[#879391]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Documento
                </p>
              </div>
            </div>
            
            <button
              onClick={removeFile}
              disabled={isPending}
              className="w-8 h-8 rounded-lg bg-red-950/20 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] hover:bg-red-950/40 transition-all cursor-pointer disabled:opacity-50"
              title="Quitar Archivo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Checkbox Aceptación LOPDGDD / RGPD */}
      <div className="flex items-start gap-2.5 pt-1.5">
        <input
          type="checkbox"
          id="acepta-privacidad-candidato"
          checked={aceptaPrivacidad}
          onChange={(e) => setAceptaPrivacidad(e.target.checked)}
          disabled={isPending}
          required
          className="w-4 h-4 mt-0.5 rounded border border-white/20 accent-[#6bd8cb] bg-white/5 cursor-pointer disabled:opacity-50"
        />
        <label
          htmlFor="acepta-privacidad-candidato"
          className="text-[10px] text-[#879391] leading-relaxed select-none cursor-pointer text-left"
        >
          Confirmo que el candidato ha entregado explícitamente su consentimiento para el tratamiento y almacenamiento seguro de su currículum vitae en Azul ATS conforme al <span className="text-[#c4c1fb]">Reglamento General de Protección de Datos (RGPD)</span> y LOPDGDD de España.
        </label>
      </div>

      {/* Status Feedback Banner */}
      {feedback && (
        <div
          className={`flex gap-2.5 p-3 rounded-xl border text-xs leading-relaxed transition-all ${
            feedback.type === "success"
              ? "border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-[#6bd8cb]"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-left font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Hidden button to submit standard inputs inside the form scope */}
      <button type="submit" className="hidden" />
    </form>
  );
}
