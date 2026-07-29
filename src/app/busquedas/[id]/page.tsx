'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, 
  Briefcase, 
  Building2, 
  FolderDot, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import SearchForm from "@/app/components/SearchForm";
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";

export default function DetalleBusquedaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { user, loading: authLoading } = useAuth();
  const [searchItem, setSearchItem] = useState<Busqueda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load search data
  const loadSearch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const allSearches = await getBusquedasAPI();
      const found = allSearches.find(b => b.id === id || b.id_busqueda === id);
      if (found) {
        setSearchItem(found);
        setError(null);
      } else {
        setError("La búsqueda solicitada no existe o no se encuentra disponible.");
      }
    } catch (err: any) {
      console.error("Error cargando la búsqueda:", err);
      setError(err.message || "Error al conectar con la API de búsquedas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      loadSearch();
    }
  }, [id, user, authLoading]);

  if (authLoading || (loading && !searchItem && !error)) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-[#879391] font-medium tracking-wide">Cargando expediente de la búsqueda...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="ambient-blur-1 top-20 right-20 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-20 left-20 pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Link 
                href="/busquedas" 
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#c4c1fb] hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Búsquedas</span>
              </Link>

              <span className="text-white/20">/</span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#c4c1fb] tracking-widest">Maestro de Búsquedas</span>
                <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
                  ID: P-BUS-02
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-[#0d9488]/20 shrink-0">
                <Briefcase className="w-5 h-5 text-[#101415]" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  {searchItem ? searchItem.perfil_busqueda : "Editar Búsqueda"}
                </h1>
                <p className="text-xs text-[#879391]">
                  {searchItem ? `Cliente: ${searchItem.cliente} • ID: ${searchItem.id}` : "Formulario completo de edición"}
                </p>
              </div>
            </div>
          </div>

          {searchItem && (
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                searchItem.estado_fase === "Abierta" || searchItem.estado_fase === "abierta"
                  ? "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {searchItem.estado_fase || "Abierta"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#c4c1fb]">
                Prioridad: {searchItem.prioridad || "Normal"}
              </span>
            </div>
          )}
        </header>

        {error ? (
          <div className="p-8 rounded-3xl border border-red-500/20 bg-red-950/10 text-center space-y-4 max-w-xl mx-auto">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No se pudo cargar la búsqueda</h3>
            <p className="text-xs text-red-300">{error}</p>
            <div className="pt-2">
              <Link 
                href="/busquedas" 
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al listado de búsquedas</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-[#16191b] backdrop-blur-md shadow-2xl space-y-8">
            
            {/* Header info banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#6bd8cb]" />
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-[#6bd8cb] tracking-wider">
                    Edición a Pantalla Completa
                  </h3>
                  <p className="text-[11px] text-[#879391]">
                    Modifica el expediente completo de la posición. Todos los cambios en criterios de screening recalcularán automáticamente el semáforo y fit score en el pipeline de los candidatos postulados.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Banner */}
            {saveSuccess && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold">¡Búsqueda actualizada exitosamente con la Server Action del servidor!</span>
              </div>
            )}

            {/* Full width SearchForm */}
            {searchItem && (
              <SearchForm
                initialData={searchItem}
                onSuccess={(savedData) => {
                  setSaveSuccess(true);
                  if (savedData) {
                    setSearchItem(prev => {
                      if (!prev) return savedData;
                      const incomingCrit = savedData.criterios_screening || savedData.criterios;
                      return {
                        ...prev,
                        ...savedData,
                        criterios_screening: (incomingCrit && incomingCrit.length > 0) ? incomingCrit : prev.criterios_screening
                      };
                    });
                  }
                  loadSearch();
                  setTimeout(() => setSaveSuccess(false), 4000);
                }}
                onClose={() => {
                  router.push("/busquedas");
                }}
                onSubmittingChange={setIsSubmitting}
                showSubmitButton={true}
                submitButtonText="Guardar Cambios de la Búsqueda"
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
