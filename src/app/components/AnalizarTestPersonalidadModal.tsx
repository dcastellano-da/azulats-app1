'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileCheck, 
  Cpu, 
  Database 
} from 'lucide-react';
import { analizarTestPersonalidadAction } from '@/actions/pipeline';
import type { TestPersonalidad } from '@/types/screening';

interface AnalizarTestPersonalidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  candidateName: string;
  onAnalysisComplete?: (testData: TestPersonalidad) => void;
}

export default function AnalizarTestPersonalidadModal({
  isOpen,
  onClose,
  pipelineId,
  candidateName,
  onAnalysisComplete
}: AnalizarTestPersonalidadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setDragActive(false);
      setIsProcessing(false);
      setProgressPercent(0);
      setActiveStep(1);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Formato no soportado. Por favor sube una imagen (.png, .jpg, .jpeg, .webp).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('El tamaño de la imagen supera el límite permitido de 5MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(15);
    setActiveStep(1);

    // Animación fluida de progreso ("Efecto Wow") mientras aguarda la inferencia
    const timerStep1 = setTimeout(() => {
      setProgressPercent(45);
      setActiveStep(2);
    }, 1200);

    const timerStep2 = setTimeout(() => {
      setProgressPercent(75);
      setActiveStep(3);
    }, 2800);

    try {
      const formData = new FormData();
      formData.append('imagen', selectedFile);
      formData.append('file', selectedFile);

      const response = await analizarTestPersonalidadAction(pipelineId, formData);

      clearTimeout(timerStep1);
      clearTimeout(timerStep2);

      if (response.success) {
        setProgressPercent(100);
        setActiveStep(3);

        const extractedTest: TestPersonalidad = response.data?.f2_evaluacion?.test_personalidad 
          || response.data?.evaluacion?.test_personalidad 
          || response.data?.test_personalidad;

        setTimeout(() => {
          if (onAnalysisComplete && extractedTest) {
            onAnalysisComplete(extractedTest);
          }
          onClose();
        }, 800);
      } else {
        setIsProcessing(false);
        setProgressPercent(0);
        setErrorMessage(response.message || 'Ocurrió un fallo en el procesamiento del test por la IA.');
      }
    } catch (err: any) {
      clearTimeout(timerStep1);
      clearTimeout(timerStep2);
      setIsProcessing(false);
      setProgressPercent(0);
      setErrorMessage(err.message || 'Error de red o conexión al procesar la captura de pantalla.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#121618]/90 border border-[#6bd8cb]/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-left backdrop-blur-xl animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de ambiente */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#6bd8cb]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera del Modal */}
        <div className="flex justify-between items-start pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#6bd8cb]/20 to-[#9b5de5]/20 border border-[#6bd8cb]/40 text-[#6bd8cb] shadow-lg shadow-[#6bd8cb]/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-bold font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded border border-[#6bd8cb]/20 uppercase tracking-widest">
                Cognitive Fit Vision (CFV) - V3
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight mt-0.5">
                Análisis Psicométrico con IA
              </h2>
              <p className="text-xs text-[#879391]">
                Postulante: <strong className="text-white">{candidateName}</strong>
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Banner de Mensaje de Error (Interceptación de 400, 429, 500 y Red) */}
        {errorMessage && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs flex justify-between items-start gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-rose-300">Fallo en el Análisis del Test</span>
                <p className="text-[11px] leading-relaxed text-rose-200/90">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white font-bold text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Área de Carga / Drag & Drop */}
        {!isProcessing ? (
          <div className="space-y-5 relative z-10">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
                dragActive
                  ? 'border-[#6bd8cb] bg-[#6bd8cb]/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-[#6bd8cb]/60 bg-[#6bd8cb]/5'
                  : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#6bd8cb]">
                {selectedFile ? (
                  <FileCheck className="w-7 h-7 text-[#6bd8cb]" />
                ) : (
                  <UploadCloud className="w-7 h-7 text-[#879391]" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">{selectedFile.name}</span>
                  <span className="text-[10px] text-[#6bd8cb] font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">
                    Arrastra aquí la captura del test de personalidad o haz clic para examinar
                  </span>
                  <p className="text-[10px] text-[#879391]">
                    Formatos admitidos: .png, .jpg, .jpeg, .webp (Hasta 5MB).
                  </p>
                </div>
              )}
            </div>

            {/* Acciones de Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleStartAnalysis}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6bd8cb] to-[#0d9488] text-stone-950 hover:opacity-90 font-black text-xs cursor-pointer transition-all shadow-lg shadow-[#6bd8cb]/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analizar Test con IA</span>
              </button>
            </div>
          </div>
        ) : (
          /* Estado de Procesamiento / Animación "Efecto Wow" */
          <div className="space-y-6 py-4 relative z-10 animate-fadeIn">
            {/* Barra de progreso porcentual animada */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#6bd8cb] font-bold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6bd8cb]" />
                  <span>Procesando inferencia psicométrica...</span>
                </span>
                <span className="text-white font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9b5de5] via-[#6bd8cb] to-[#4eb8ab] transition-all duration-700 ease-out shadow-lg shadow-[#6bd8cb]/30"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Secuencia Visual de Pasos Animados */}
            <div className="space-y-3 pt-2">
              {/* Paso 1 */}
              <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                activeStep >= 1 ? 'bg-white/5 border-[#6bd8cb]/30 text-white' : 'bg-white/[0.01] border-white/5 text-white/40'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                  activeStep > 1 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : activeStep === 1 
                    ? 'bg-[#6bd8cb]/20 text-[#6bd8cb] border border-[#6bd8cb]/40 animate-pulse' 
                    : 'bg-white/5 text-white/30'
                }`}>
                  {activeStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <FileCheck className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">1. Lectura y validación de imagen</span>
                  <p className="text-[10px] text-[#879391]">Comprobando formato y preparando el binario en RAM.</p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                activeStep >= 2 ? 'bg-white/5 border-[#6bd8cb]/30 text-white' : 'bg-white/[0.01] border-white/5 text-white/40'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                  activeStep > 2 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : activeStep === 2 
                    ? 'bg-[#6bd8cb]/20 text-[#6bd8cb] border border-[#6bd8cb]/40 animate-pulse' 
                    : 'bg-white/5 text-white/30'
                }`}>
                  {activeStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Cpu className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">2. Inferencia y análisis con IA (Gemini)</span>
                  <p className="text-[10px] text-[#879391]">Extrayendo arquetipos, 5 dimensiones y evaluando encaje cultural.</p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                activeStep >= 3 ? 'bg-white/5 border-[#6bd8cb]/30 text-white' : 'bg-white/[0.01] border-white/5 text-white/40'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                  progressPercent === 100 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : activeStep === 3 
                    ? 'bg-[#6bd8cb]/20 text-[#6bd8cb] border border-[#6bd8cb]/40 animate-pulse' 
                    : 'bg-white/5 text-white/30'
                }`}>
                  {progressPercent === 100 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Database className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">3. Sincronización y registro</span>
                  <p className="text-[10px] text-[#879391]">Estructurando ficha y guardando marca temporal inmutable.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
