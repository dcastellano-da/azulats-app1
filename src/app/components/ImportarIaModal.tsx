'use client';

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, FileText, Trash2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { importarCandidatoIA_API } from "@/actions/candidatos";

interface ImportarIaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nombreCompleto: string) => void;
}

export default function ImportarIaModal({ isOpen, onClose, onSuccess }: ImportarIaModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (!isOpen) return null;

  const validateFile = (selected?: File) => {
    if (!selected) return;

    // Weight boundary check: size > 5MB
    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setFileError("El archivo supera el tamaño máximo permitido de 5MB.");
      return;
    }

    // Type checking: PDF, DOC, DOCX
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    if (!allowedTypes.includes(selected.type) && !allowedExtensions.test(selected.name)) {
      setFile(null);
      setFileError("Formato de archivo inválido. Solo se admiten formatos PDF, DOC o DOCX.");
      return;
    }

    setFile(selected);
    setFileError(null);
    setErrorMessage(null);
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
    if (!isProcessing && e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setErrorMessage("Por favor, selecciona un currículum para procesar.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const response = await importarCandidatoIA_API(formData);
      if (response.success && response.status === 201) {
        const nombre = response.data?.nombre_completo || "Candidato Desconocido";
        onSuccess(nombre);
      } else {
        setErrorMessage(response.message || "Error al procesar la importación con IA.");
      }
    } catch (err: any) {
      setErrorMessage("Error de red inesperado al conectar con el servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-[#000000]/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Modal box */}
      <div className="relative z-10 w-full max-w-md bg-[#15181a]/95 border border-white/10 rounded-3xl p-6 shadow-2xl text-white backdrop-blur-md flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6bd8cb]" />
            <h3 className="text-base font-bold text-white tracking-tight">Importar con IA</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-[#c4c1fb] transition-all ${
              isProcessing ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 hover:text-white cursor-pointer"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative description */}
        <div className="text-xs text-[#879391] leading-relaxed">
          Sube un CV y nuestra IA extraerá los datos de contacto, habilidades e idiomas para crear la ficha automáticamente.
        </div>

        {/* Drag and Drop Container */}
        <div className="flex flex-col">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={isProcessing}
            className="hidden"
          />

          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`w-full min-h-[140px] rounded-2xl border border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-[#6bd8cb] bg-[#6bd8cb]/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
              } ${isProcessing ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              <Upload className="w-8 h-8 text-[#6bd8cb] mb-2" />
              <p className="text-xs font-bold text-white mb-0.5">Arrastra y suelta tu CV aquí</p>
              <p className="text-[10px] text-[#879391] font-medium">o haz clic para explorar en el ordenador</p>
              <p className="text-[9px] text-[#c4c1fb] mt-2.5 bg-[#c4c1fb]/5 px-2.5 py-0.5 rounded border border-[#c4c1fb]/10 animate-pulse">
                PDF, DOC, DOCX • Máx 5MB
              </p>
              {fileError && (
                <div className="mt-3 flex items-center gap-1.5 text-rose-400 text-[10px] font-semibold bg-rose-500/5 px-2 py-1 rounded border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/5">
              <div className="flex items-center gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-[#6bd8cb]/20 flex items-center justify-center text-[#6bd8cb] shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-white truncate">{file.name}</p>
                  <p className="text-[9px] text-[#879391]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                onClick={removeFile}
                disabled={isProcessing}
                className="w-8 h-8 rounded-lg bg-red-950/20 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] hover:bg-red-950/40 transition-all cursor-pointer disabled:opacity-50"
                title="Quitar Archivo"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* Global errors */}
        {errorMessage && (
          <div className="flex gap-2.5 p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs leading-relaxed text-left font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2 justify-end">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-[#c4c1fb]/20 bg-white/5 transition-all ${
              isProcessing ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"
            }`}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleProcess}
            disabled={isProcessing || !file}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/95 transition-all shadow-md flex items-center gap-1.5 ${
              isProcessing || !file ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Procesar PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Loading overlay panel blocker */}
        {isProcessing && (
          <div className="absolute inset-0 bg-[#15181a]/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-[#6bd8cb]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-[#6bd8cb] animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white">Inferencia de IA en Curso</h4>
              <p className="text-[10px] text-[#879391] max-w-[200px] leading-relaxed">
                Gemini está extrayendo información estructurada del CV. Por favor no cierres este modal.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
