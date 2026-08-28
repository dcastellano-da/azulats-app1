'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  MapPin, 
  Bell, 
  LayoutDashboard, 
  Briefcase, 
  Users,
  Shield,
  Mail,
  AlertCircle,
  Save, 
  Clock,
  Contact,
  ShieldAlert,
  Trash2,
  Compass,
  LogOut,
  Building2,
  Upload,
  Image,
  Sparkles,
  CheckCircle2
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getCandidatosAPI, eliminarCandidatoAPI } from "@/actions/candidatos";
import { db, storage } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getConfiguracionAgenciaAPI, actualizarConfiguracionAgenciaAPI } from "@/actions/configuracion";

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  // Navigation indicators and inputs options state
  const [selectedTimeZone, setSelectedTimeZone] = useState("Europe/Madrid");
  const [selectedRegion, setSelectedRegion] = useState("Península / Baleares");
  
  // Interactive notification toggles states
  const [notifyNewCandidate, setNotifyNewCandidate] = useState(true);
  const [notifySystemAlerts, setNotifySystemAlerts] = useState(true);
  const [notifyAssignment, setNotifyAssignment] = useState(false);

  // Agency Branding State (P-CFG-01)
  const [nombreAgencia, setNombreAgencia] = useState("Azul Consultora Tech");
  const [sloganAgencia, setSloganAgencia] = useState("Headhunting & IT Talent Solutions");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [mostrarSelloPoweredBy, setMostrarSelloPoweredBy] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingToastMessage, setBrandingToastMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load Agency Branding on Mount from Server Action API & LocalStorage
  useEffect(() => {
    const fetchAgencyBranding = async () => {
      // 1. Primary: Server Action API call to Express Microservice
      try {
        const apiRes = await getConfiguracionAgenciaAPI();
        if (apiRes.success && apiRes.data) {
          const d = apiRes.data;
          if (d.nombre_comercial || d.nombre_agencia || d.nombreAgencia) {
            setNombreAgencia(d.nombre_comercial || d.nombre_agencia || d.nombreAgencia);
          }
          if (d.slogan_agencia || d.sloganAgencia) {
            setSloganAgencia(d.slogan_agencia || d.sloganAgencia);
          }
          if (d.logo_url || d.logoUrl) {
            setLogoUrl(d.logo_url || d.logoUrl);
          }
          if (typeof d.sello_texto === "string") {
            setMostrarSelloPoweredBy(d.sello_texto.trim().length > 0);
          } else if (typeof d.mostrar_sello_powered_by === "boolean") {
            setMostrarSelloPoweredBy(d.mostrar_sello_powered_by);
          } else if (typeof d.mostrarSelloPoweredBy === "boolean") {
            setMostrarSelloPoweredBy(d.mostrarSelloPoweredBy);
          }
          return;
        }
      } catch (_) {}

      // 2. Fallback to localStorage
      try {
        const savedBranding = localStorage.getItem("ats_agency_branding");
        if (savedBranding) {
          const parsed = JSON.parse(savedBranding);
          if (parsed.nombreAgencia) setNombreAgencia(parsed.nombreAgencia);
          if (parsed.sloganAgencia) setSloganAgencia(parsed.sloganAgencia);
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
          if (typeof parsed.mostrarSelloPoweredBy === "boolean") setMostrarSelloPoweredBy(parsed.mostrarSelloPoweredBy);
        }
      } catch (_) {}
    };

    fetchAgencyBranding();
  }, []);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG, WEBP, SVG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen excede el límite máximo de 5MB.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);

    try {
      // 1. Send clean JSON payload to Server Action for Express Microservice Backend
      const payload = {
        nombreAgencia: nombreAgencia.trim(),
        sloganAgencia: sloganAgencia.trim(),
        logoUrl: logoUrl,
        mostrarSelloPoweredBy
      };

      const actionRes = await actualizarConfiguracionAgenciaAPI(payload);

      // 2. Save to localStorage local fallback
      localStorage.setItem("ats_agency_branding", JSON.stringify({
        ...payload,
        updatedAt: new Date().toISOString()
      }));

      if (actionRes.success) {
        setBrandingToastMessage({
          type: "success",
          message: actionRes.message || "Branding e identidad institucional guardados con éxito (P-CFG-01)."
        });
      } else {
        setBrandingToastMessage({
          type: "error",
          message: actionRes.message || "El backend no pudo procesar la solicitud (HTTP " + actionRes.status + ")."
        });
      }

      setTimeout(() => setBrandingToastMessage(null), 6000);
    } catch (err: any) {
      console.error("Error al guardar branding de agencia:", err);
      setBrandingToastMessage({
        type: "error",
        message: err.message || "Ocurrió un error al guardar la configuración."
      });
      setTimeout(() => setBrandingToastMessage(null), 6000);
    } finally {
      setSavingBranding(false);
    }
  };

  // Success alert Banner state for settings save simulation
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Danger Zone / Derecho al olvido (RGPD) state
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dangerZoneFeedback, setDangerZoneFeedback] = useState<{type: "success" | "error"; message: string} | null>(null);

  // Client-side authentication protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load candidate list for Super Admin Zone
  const loadCandidatosList = async () => {
    setLoadingCandidatos(true);
    try {
      const response = await getCandidatosAPI();
      if (response.success && response.data) {
        setCandidatos(response.data);
      }
    } catch (error) {
      console.error("Error loading candidates in config page:", error);
    } finally {
      setLoadingCandidatos(false);
    }
  };

  useEffect(() => {
    if (user?.rol === "Super Administrador") {
      loadCandidatosList();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleStartDelete = (id: string) => {
    setDeleteConfirmId(id);
    setDeleteStep(1);
    setConfirmText("");
    setDangerZoneFeedback(null);
  };

  const cancelDeleteFlow = () => {
    setDeleteConfirmId(null);
    setDeleteStep(1);
    setConfirmText("");
  };

  const handleConfirmHardDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const response = await eliminarCandidatoAPI(deleteConfirmId, true);
      if (response.success) {
        setDangerZoneFeedback({
          type: "success",
          message: "Candidato y CV en storage purgados físicamente con éxito (RGPD)."
        });
        await loadCandidatosList();
      } else {
        setDangerZoneFeedback({
          type: "error",
          message: response.message || "Error al purgar los datos físicamente."
        });
      }
    } catch (err) {
      setDangerZoneFeedback({
        type: "error",
        message: "Error técnico al ejecutar el borrado físico."
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const triggerSaveSimulation = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden">
      {/* Background ambient radial blurs consistent with Stitch */}
      <div className="ambient-blur-1 top-20 right-20 pointer-events-none"></div>
      <div className="ambient-blur-2 bottom-20 left-20 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Banner Header */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex justify-between items-center w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6bd8cb] to-[#0d9488] flex items-center justify-center shadow-lg shadow-[#6bd8cb]/20">
                <Settings className="w-6 h-6 text-[#101415]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#c4c1fb] bg-[#c4c1fb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Configuración General
                  </span>
                  <span className="text-[10px] font-bold text-white/40">Ref: AJ-90</span>
                  <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
                    ID: P-CFG-01
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Ajustes del Sistema
                </h1>
              </div>
            </div>

            {/* Mobile/Tablet Avatar (visible in top-right of the title block on mobile/tablet) */}
            <Link
              href="/configuracion"
              className="lg:hidden relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] text-white flex items-center justify-center text-xs font-black shadow-md shadow-[#9b5de5]/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-[#9b5de5] select-none cursor-pointer shrink-0"
              title="Ajustes de Perfil (Actual)"
            >
              {user?.displayName
                ? user.displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                : user?.email
                  ? user.email.slice(0, 2).toUpperCase()
                  : "AD"}
            </Link>
          </div>

          {/* Quick links to alternate views */}
          <div className="flex items-start gap-3">
            <div className="flex items-center flex-wrap gap-3">
              {/* Grupo 1: Navegación Global */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <Link
                  href="/busquedas"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Búsquedas</span>
                </Link>

                <Link
                  href="/talento"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Contact className="w-4 h-4" />
                  <span className="hidden sm:inline">Postulantes</span>
                </Link>
              </div>

              {/* Separador visual */}
              <div className="text-white/20 select-none text-xs font-light hidden sm:block">|</div>

              {/* Grupo 2: Navegación Contextual del Pipeline */}
              <div className="flex items-center gap-1 bg-[#9b5de5]/5 border border-[#9b5de5]/20 rounded-xl p-1 shadow-inner">
                <Link
                  href="/descubrimiento"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c4c1fb] hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span className="hidden sm:inline">F1 Descubrimiento</span>
                </Link>

                <Link
                  href="/evaluacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9b5de5] hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-[#9b5de5]" />
                  <span className="hidden sm:inline">F2 Evaluación</span>
                </Link>

                <Link
                  href="/presentacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">F3 Cliente</span>
                </Link>

                <Link
                  href="/cierre"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline">F4 Cierre</span>
                </Link>
              </div>
            </div>

            <Link
              href="/configuracion"
              className="hidden lg:flex relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] text-white flex items-center justify-center text-xs font-black shadow-md shadow-[#9b5de5]/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-[#9b5de5] select-none cursor-pointer shrink-0"
              title="Ajustes de Perfil (Actual)"
            >
              {user?.displayName
                ? user.displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                : user?.email
                  ? user.email.slice(0, 2).toUpperCase()
                  : "AD"}
            </Link>
          </div>
        </header>

        {/* Success Alert Banner */}
        {showSuccessToast && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-3 animate-fadeIn">
            <Shield className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Ajustes simulados con éxito</p>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">La configuración se ha guardado de forma local para esta maqueta visual.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left panel: Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col items-center text-center space-y-4">
              
              {/* Profile Avatar Graphics */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] p-1 shadow-xl shadow-[#9b5de5]/10">
                  <div className="w-full h-full rounded-full bg-[#101415] flex items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-[#6bd8cb]">
                      {authLoading ? "..." : getInitials(user?.displayName ?? null, user?.email ?? null)}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#6bd8cb] border-2 border-[#101415]">
                  <Shield className="w-3.5 h-3.5 text-[#101415]" />
                </div>
              </div>

              {/* User Identity Details */}
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {authLoading ? "Cargando perfil..." : (user?.displayName || user?.email || "Usuario Invitado")}
                </h2>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#6bd8cb]">
                  <Shield className="w-3.5 h-3.5 text-[#6bd8cb]/70" />
                  <span className="font-semibold text-[10px] uppercase tracking-wider">
                    {authLoading ? "Cargando..." : (user?.rol || "Reclutador")}
                  </span>
                </div>
              </div>

              {/* Spain Market Details Metadata */}
              <div className="w-full pt-4 border-t border-white/5 space-y-3.5 text-xs text-[#879391]">
                <div className="flex items-center justify-between">
                  <span className="text-left font-medium">Email:</span>
                  {authLoading ? (
                    <span className="text-right text-white font-mono text-[10px]">...</span>
                  ) : user?.email ? (
                    <a
                      href={`mailto:${user.email}`}
                      className="text-right text-[#6bd8cb] hover:underline truncate max-w-[150px] font-mono text-[10px] cursor-pointer"
                    >
                      {user.email}
                    </a>
                  ) : (
                    <span className="text-right text-white font-mono text-[10px]">No disponible</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-left font-medium">Ubicación:</span>
                  <span className="text-right text-white">Madrid, España</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-left font-medium">Zona Horaria:</span>
                  <span className="text-right text-white">{selectedTimeZone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-left font-medium">Estado de Cuenta:</span>
                  <span className="text-right text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold">Activo</span>
                </div>
              </div>

              {/* Botón de Logout / Cerrar Sesión */}
              <div className="w-full pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-stone-950 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión (Logout)</span>
                </button>
              </div>

            </div>
          </div>

          {/* Right panel: Preferences Settings Forms */}
          <div className="md:col-span-2 space-y-6">

            {/* Branding de Agencia e Identidad Institucional (P-CFG-01) Card */}
            <div className="rounded-2xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/5 backdrop-blur-md p-6 space-y-6 shadow-xl shadow-[#6bd8cb]/5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 flex items-center justify-center text-[#6bd8cb]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Branding e Identidad Institucional de Agencia
                    </h3>
                    <p className="text-xs text-[#879391]">
                      Identidad comercial utilizada en informes, exportaciones PDF y comunicaciones corporativas.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6bd8cb] bg-[#6bd8cb]/10 px-2.5 py-1 rounded-md border border-[#6bd8cb]/20">
                  Ref: P-CFG-01
                </span>
              </div>

              {brandingToastMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                    brandingToastMessage.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {brandingToastMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{brandingToastMessage.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nombre Comercial */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#879391] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
                    <span>Nombre Comercial de la Consultora / Agencia *</span>
                  </label>
                  <input
                    type="text"
                    value={nombreAgencia}
                    onChange={(e) => setNombreAgencia(e.target.value)}
                    placeholder="Ej. Azul Consultora Tech..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] font-semibold"
                  />
                </div>

                {/* Slogan */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#879391] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#c4c1fb]" />
                    <span>Slogan o Descripción Corta</span>
                  </label>
                  <input
                    type="text"
                    value={sloganAgencia}
                    onChange={(e) => setSloganAgencia(e.target.value)}
                    placeholder="Ej. Headhunting & IT Talent Solutions..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                  />
                </div>

              </div>

              {/* Logo Upload Section */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold text-[#879391] uppercase tracking-wider flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-[#6bd8cb]" />
                  <span>Logo Oficial de la Agencia (Para Ficha PDF) *</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* File Upload Box */}
                  <div className="md:col-span-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/15 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] hover:border-[#6bd8cb]/50 transition-all cursor-pointer group">
                      <Upload className="w-6 h-6 text-[#6bd8cb] mb-1.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white">Haz clic para subir el logo de la agencia</span>
                      <span className="text-[10px] text-[#879391] mt-0.5">PNG, JPG, WEBP o SVG (Máx. 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {/* Live Preview Box */}
                  <div className="md:col-span-1 p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center min-h-[100px] text-center space-y-1.5">
                    <span className="text-[10px] font-bold text-[#879391] uppercase tracking-wider">Vista Previa Logo</span>
                    {logoUrl ? (
                      <div className="relative group">
                        <img
                          src={logoUrl}
                          alt="Logo de la Agencia"
                          className="max-h-12 max-w-full object-contain rounded-lg border border-white/10 p-1 bg-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="text-[9px] text-rose-400 hover:underline block mt-1 cursor-pointer"
                        >
                          Quitar logo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/30 space-y-1">
                        <Building2 className="w-7 h-7" />
                        <span className="text-[10px]">Sin logo cargado</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Toggle Sello Powered by Azul ATS */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb]" /> Sello Acreditativo "Powered by Azul ATS"
                  </span>
                  <p className="text-[10px] text-[#879391]">
                    Incluye la firma institucional en el pie de página de todos los dossiers exportados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarSelloPoweredBy(!mostrarSelloPoweredBy)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    mostrarSelloPoweredBy ? "bg-[#6bd8cb]" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#101415] shadow ring-0 transition duration-200 ease-in-out ${
                      mostrarSelloPoweredBy ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Botón de Guardado */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="px-5 py-2.5 rounded-xl bg-[#6bd8cb] hover:bg-[#5bc4b7] text-stone-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#6bd8cb]/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingBranding ? "Guardando..." : "Guardar Branding de Agencia"}</span>
                </button>
              </div>

            </div>

            {/* Regional Settings Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <MapPin className="w-5 h-5 text-[#6bd8cb]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Preferencias Regionales (España)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Zona Horaria */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#879391] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#c4c1fb]" />
                    <span>Zona Horaria *</span>
                  </label>
                  <select
                    value={selectedTimeZone}
                    onChange={(e) => setSelectedTimeZone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer"
                  >
                    <option value="Europe/Madrid" className="bg-[#15181a]">Europe/Madrid (Península / Baleares)</option>
                    <option value="Atlantic/Canary" className="bg-[#15181a]">Atlantic/Canary (Islas Canarias)</option>
                    <option value="Europe/London" className="bg-[#15181a]">Europe/London (GMT)</option>
                  </select>
                </div>

                {/* Región Específica */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#879391] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]" />
                    <span>Región Territorial *</span>
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer"
                  >
                    <option value="Península / Baleares" className="bg-[#15181a]">Península y Baleares (CET / UTC+1)</option>
                    <option value="Islas Canarias" className="bg-[#15181a]">Islas Canarias (WET / UTC+0)</option>
                    <option value="Ceuta / Melilla" className="bg-[#15181a]">Ceuta y Melilla</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification settings Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gestión de Notificaciones</h3>
              </div>

              <div className="space-y-4">
                
                {/* Toggle 1: Nuevo Candidato */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Nuevo candidato en bandeja</p>
                    <p className="text-[10px] text-[#879391]">Recibir alertas visuales al registrar un currículum para una búsqueda activa.</p>
                  </div>
                  {/* Styled Switch Checkbox */}
                  <button
                    type="button"
                    onClick={() => setNotifyNewCandidate(!notifyNewCandidate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifyNewCandidate ? "bg-[#6bd8cb]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#101415] shadow ring-0 transition duration-200 ease-in-out ${
                        notifyNewCandidate ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Alertas de Sistema */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Alerta de sistema (Microservicios APIS)</p>
                    <p className="text-[10px] text-[#879391]">Recibir alertas críticas si hay fallas en la sincronización con la nube de Google.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifySystemAlerts(!notifySystemAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifySystemAlerts ? "bg-[#6bd8cb]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#101415] shadow ring-0 transition duration-200 ease-in-out ${
                        notifySystemAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Asignación de nueva búsqueda */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Asignación de nueva búsqueda</p>
                    <p className="text-[10px] text-[#879391]">Alerta si eres registrado como responsable operativo de un requerimiento.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyAssignment(!notifyAssignment)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifyAssignment ? "bg-[#6bd8cb]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#101415] shadow ring-0 transition duration-200 ease-in-out ${
                        notifyAssignment ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

              </div>
            </div>

            {/* Danger Zone: Derecho al Olvido (Super Administrador Only) */}
            {user.rol === "Super Administrador" && (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/[0.03] backdrop-blur-md p-6 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-red-500/10">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Zona de Peligro / Derecho al Olvido</h3>
                    <p className="text-[10px] text-[#879391] mt-0.5">Gestión de remoción física permanente de datos (RGPD / España).</p>
                  </div>
                </div>

                {dangerZoneFeedback && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    dangerZoneFeedback.type === "success" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-red-500/30 bg-red-500/5 text-red-400"
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{dangerZoneFeedback.message}</span>
                  </div>
                )}

                {loadingCandidatos ? (
                  <div className="flex items-center justify-center py-6 text-xs text-[#879391]">
                    <div className="w-4 h-4 border-2 border-[#879391] border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cargando padrón de candidatos...
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white/5 text-[10px] font-bold text-[#879391] uppercase tracking-wider border-b border-white/5 font-semibold">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3">Puesto / Cargo</th>
                          <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium text-white/80">
                        {candidatos.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-[#879391]">
                              Ningún candidato registrado en la base de datos local.
                            </td>
                          </tr>
                        ) : (
                          candidatos.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3.5 font-mono text-[9px] text-[#879391]">{c.id}</td>
                              <td className="px-4 py-3.5 text-white font-semibold">{c.nombre_completo}</td>
                              <td className="px-4 py-3.5 text-[#c4c1fb]">{c.puesto}</td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleStartDelete(c.id)}
                                  className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-300 hover:bg-red-950/60 transition-all font-bold text-[9px] cursor-pointer"
                                >
                                  Eliminar Permanentemente
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#879391] hover:bg-white/10 hover:text-white transition-all cursor-pointer font-medium"
              >
                Cancelar cambios
              </button>
              
              <button
                type="button"
                onClick={triggerSaveSimulation}
                className="px-6 py-2.5 rounded-xl bg-[#6bd8cb] text-[#101415] hover:bg-[#5bc2b5] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#6bd8cb]/20"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Ajustes</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Doble-paso Modal para Hard Delete (RGPD) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101415]/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#15181a] p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Confirmar Borrado Físico</h4>
                <p className="text-[10px] text-red-400 font-semibold uppercase tracking-widest mt-0.5">Cumplimiento RGPD (España)</p>
              </div>
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-4">
                <p className="text-xs text-[#879391] leading-relaxed">
                  Atención: La remoción física del expediente y el archivo CV en Cloud Storage cumple el Reglamento General de Protección de Datos (RGPD) en España. <strong className="text-white">Esta acción no se puede deshacer</strong> y se purgará de todos los microservicios indexados.
                </p>
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={cancelDeleteFlow}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-[#879391] hover:bg-white/10 hover:text-white transition-all font-semibold cursor-pointer"
                  >
                    Salir / Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all font-black text-xs shadow-lg shadow-red-500/20 cursor-pointer"
                  >
                    Entendido, Siguiente Paso
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#879391]">
                  Por favor escribe <strong className="text-red-400">CONFIRMAR</strong> para proceder con el borrado físico de los datos:
                </p>
                <input
                  type="text"
                  placeholder="Escribe CONFIRMAR"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-all placeholder-[#879391] font-semibold"
                />
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={cancelDeleteFlow}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-[#879391] hover:bg-white/10 hover:text-white transition-all font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={confirmText !== "CONFIRMAR" || deleting}
                    onClick={handleConfirmHardDelete}
                    className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-650 transition-all font-black text-xs shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {deleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Purgando...</span>
                      </>
                    ) : (
                      <span>Borrar Definitivamente</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
