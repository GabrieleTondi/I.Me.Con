"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ShieldCheck,
  Phone,
  Building,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Scale,
  User,
  Users,
  Check,
  Info,
} from "lucide-react";
import Image from "next/image";
import { createMediationRequestAction, getAreeAction } from "@/app/actions/mediation-actions";

export const ContactArea = () => {
  // SELETTORE TAB PRINCIPALE
  const [activeTab, setActiveTab] = useState<"mediazione" | "generale">("mediazione");
  const [aree, setAree] = useState<{ id: number; nomeArea: string }[]>([]);

  useEffect(() => {
    // Leggi il parametro 'tab' dall'URL per decidere quale scheda visualizzare all'avvio
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "generale" || tab === "mediazione") {
      setActiveTab(tab);
    }

    getAreeAction().then((data) => {
      setAree(data);
      if (data.length > 0) {
        setMediationData((prev) => ({ ...prev, areaId: data[0].id.toString() }));
      }
    });
  }, []);


  // ==========================================
  // TAB 1: WIZARD RICHIESTA DI MEDIAZIONE ADR
  // ==========================================
  const [step, setStep] = useState<number>(1);
  const [isSubmittingMediation, setIsSubmittingMediation] = useState(false);
  const [mediationError, setMediationError] = useState<string | null>(null);
  const [mediationSuccessProtocol, setMediationSuccessProtocol] = useState<string | null>(null);

  // File allegati alla sezione Dati della Controversia
  const [controversyFiles, setControversyFiles] = useState<File[]>([]);

  // Dati del modulo di Mediazione
  const [mediationData, setMediationData] = useState({
    // Step 1: Controversia
    areaId: "1",
    materia: "",
    valore: "",
    valoreIndeterminato: "false",
    descrizioneFatti: "",

    // Step 2: Istante & Legale
    istanteTipo: "PF" as "PF" | "PG",
    istanteDenominazione: "",
    istanteCodiceFiscale: "",
    istanteEmail: "",
    istanteTelefono: "",
    istanteDataNascita: "",
    istanteIndirizzo: "",
    istanteComune: "",
    istanteCap: "",
    istanteProvincia: "",

    haAvvocato: "false",
    avvocatoNome: "",
    avvocatoCodiceFiscale: "",
    avvocatoEmail: "",

    // Step 3: Convenuto
    convenutoTipo: "PF" as "PF" | "PG",
    convenutoDenominazione: "",
    convenutoCodiceFiscale: "",
    convenutoEmail: "",
    convenutoTelefono: "",
    convenutoDataNascita: "",
    convenutoIndirizzo: "",
    convenutoComune: "",
    convenutoCap: "",
    convenutoProvincia: "",
  });

  const handleMediationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMediationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setControversyFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setControversyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    setMediationError(null);
    // Validazioni step-specifiche veloci
    if (step === 1) {
      if (!mediationData.materia) {
        setMediationError("Seleziona la materia della controversia.");
        return;
      }
      if (mediationData.descrizioneFatti.trim().length < 10) {
        setMediationError("Inserisci una descrizione dei fatti di almeno 10 caratteri.");
        return;
      }
    } else if (step === 2) {
      if (
        !mediationData.istanteDenominazione.trim() ||
        !mediationData.istanteCodiceFiscale.trim() ||
        !mediationData.istanteEmail.trim() ||
        !mediationData.istanteDataNascita.trim() ||
        !mediationData.istanteIndirizzo.trim() ||
        !mediationData.istanteComune.trim() ||
        !mediationData.istanteCap.trim() ||
        !mediationData.istanteProvincia.trim()
      ) {
        setMediationError("Compila tutti i campi obbligatori relativi all'Istante (inclusi Nascita e Residenza).");
        return;
      }
      if (mediationData.istanteCap.trim().length !== 5) {
        setMediationError("Il CAP dell'Istante deve essere composto da 5 cifre.");
        return;
      }
      if (mediationData.istanteProvincia.trim().length < 2) {
        setMediationError("La Provincia dell'Istante deve essere di almeno 2 caratteri.");
        return;
      }
      if (mediationData.haAvvocato === "true" && (!mediationData.avvocatoNome || !mediationData.avvocatoCodiceFiscale || !mediationData.avvocatoEmail)) {
        setMediationError("Compila tutti i campi relativi all'Avvocato assistente.");
        return;
      }
    } else if (step === 3) {
      if (
        !mediationData.convenutoDenominazione.trim() ||
        !mediationData.convenutoEmail.trim() ||
        !mediationData.convenutoDataNascita.trim() ||
        !mediationData.convenutoIndirizzo.trim() ||
        !mediationData.convenutoComune.trim() ||
        !mediationData.convenutoCap.trim() ||
        !mediationData.convenutoProvincia.trim()
      ) {
        setMediationError("Compila tutti i campi obbligatori relativi al Convenuto (inclusi Nascita e Residenza).");
        return;
      }
      if (mediationData.convenutoCap.trim().length !== 5) {
        setMediationError("Il CAP del Convenuto deve essere composto da 5 cifre.");
        return;
      }
      if (mediationData.convenutoProvincia.trim().length < 2) {
        setMediationError("La Provincia del Convenuto deve essere di almeno 2 caratteri.");
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => {
    setMediationError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmitMediation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMediation(true);
    setMediationError(null);

    try {
      const formData = new FormData();
      formData.append("areaId", mediationData.areaId);
      formData.append("materia", mediationData.materia);
      formData.append("valore", mediationData.valore);
      formData.append("valoreIndeterminato", mediationData.valoreIndeterminato);
      formData.append("descrizioneFatti", mediationData.descrizioneFatti);

      formData.append("istanteTipo", mediationData.istanteTipo);
      formData.append("istanteDenominazione", mediationData.istanteDenominazione);
      formData.append("istanteCodiceFiscale", mediationData.istanteCodiceFiscale);
      formData.append("istanteEmail", mediationData.istanteEmail);
      if (mediationData.istanteTelefono) formData.append("istanteTelefono", mediationData.istanteTelefono);
      if (mediationData.istanteDataNascita) formData.append("istanteDataNascita", mediationData.istanteDataNascita);
      if (mediationData.istanteIndirizzo) formData.append("istanteIndirizzo", mediationData.istanteIndirizzo);
      if (mediationData.istanteComune) formData.append("istanteComune", mediationData.istanteComune);
      if (mediationData.istanteCap) formData.append("istanteCap", mediationData.istanteCap);
      if (mediationData.istanteProvincia) formData.append("istanteProvincia", mediationData.istanteProvincia);

      formData.append("haAvvocato", mediationData.haAvvocato);
      if (mediationData.haAvvocato === "true") {
        formData.append("avvocatoNome", mediationData.avvocatoNome);
        formData.append("avvocatoCodiceFiscale", mediationData.avvocatoCodiceFiscale);
        formData.append("avvocatoEmail", mediationData.avvocatoEmail);
      }

      formData.append("convenutoTipo", mediationData.convenutoTipo);
      formData.append("convenutoDenominazione", mediationData.convenutoDenominazione);
      if (mediationData.convenutoCodiceFiscale) formData.append("convenutoCodiceFiscale", mediationData.convenutoCodiceFiscale);
      formData.append("convenutoEmail", mediationData.convenutoEmail);
      if (mediationData.convenutoTelefono) formData.append("convenutoTelefono", mediationData.convenutoTelefono);
      if (mediationData.convenutoDataNascita) formData.append("convenutoDataNascita", mediationData.convenutoDataNascita);
      if (mediationData.convenutoIndirizzo) formData.append("convenutoIndirizzo", mediationData.convenutoIndirizzo);
      if (mediationData.convenutoComune) formData.append("convenutoComune", mediationData.convenutoComune);
      if (mediationData.convenutoCap) formData.append("convenutoCap", mediationData.convenutoCap);
      if (mediationData.convenutoProvincia) formData.append("convenutoProvincia", mediationData.convenutoProvincia);

      // Aggiungiamo i file caricati nella sezione Dati Controversia
      for (const file of controversyFiles) {
        formData.append("documentiControversia", file);
      }

      const res = await createMediationRequestAction(formData);

      if (res.success && res.protocollo) {
        setMediationSuccessProtocol(res.protocollo);
      } else {
        setMediationError(res.error || "Errore durante l'invio della richiesta.");
      }
    } catch (err: any) {
      setMediationError("Si è verificato un errore imprevisto. Riprova più tardi.");
    } finally {
      setIsSubmittingMediation(false);
    }
  };

  // ==========================================
  // TAB 2: CONTATTO GENERALE
  // ==========================================
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [isSuccessGeneral, setIsSuccessGeneral] = useState(false);

  const handleSubmitGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingGeneral(true);
    setTimeout(() => {
      setIsSubmittingGeneral(false);
      setIsSuccessGeneral(true);
      setTimeout(() => setIsSuccessGeneral(false), 4000);
    }, 1200);
  };

  // Variazioni di animazione
  const parentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="w-full flex flex-col relative bg-brand-neutral pt-20 font-sans">
      <div className="flex flex-col lg:flex-row min-h-[88vh]">
        {/* ===== SETTORE INFORMATIVO BLU SCURO - SINISTRA (40%) ===== */}
        <motion.div
          className="w-full lg:w-[40%] bg-brand-primary text-white p-10 md:p-16 flex flex-col justify-between space-y-12"
          variants={parentVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-chillax leading-tight">
              Mettiamoci in <br />
              <span className="text-brand-accent">Contatto</span>
            </h1>
            <p className="text-base text-white/85 font-light leading-relaxed max-w-sm pt-3 font-sans">
              L&apos;Istituto di Mediazione e Conciliazione I.Me.Con è al tuo fianco per risolvere controversie civili e commerciali in modo rapido e qualificato.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 text-brand-accent shrink-0" size={22} />
              <div>
                <p className="text-[11px] text-white/60 tracking-wider uppercase font-semibold">Email Segreteria</p>
                <p className="font-medium text-lg">imecon@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 text-brand-accent shrink-0" size={22} />
              <div>
                <p className="text-[11px] text-white/60 tracking-wider uppercase font-semibold">PEC Ufficiale</p>
                <p className="font-medium text-lg">imecon@pec.it</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="mt-1 text-brand-accent shrink-0" size={22} />
              <div>
                <p className="text-[11px] text-white/60 tracking-wider uppercase font-semibold">Telefono</p>
                <p className="font-medium text-lg">333 333 3333</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Building className="mt-1 text-brand-accent shrink-0" size={22} />
              <div>
                <p className="text-[11px] text-white/60 tracking-wider uppercase font-semibold">Sede Centrale</p>
                <p className="font-light text-sm text-white/85">Organismo accreditato dal Ministero della Giustizia</p>
              </div>
            </div>
          </motion.div>

          <div className="pt-4 border-t border-white/15 text-xs text-white/70">
            I.Me.Con • Risoluzione Alternativa delle Controversie (ADR)
          </div>
        </motion.div>

        {/* ===== SETTORE MODULI INTERATTIVI AZZURRINO - DESTRA (60%) ===== */}
        <div className="w-full lg:w-[60%] bg-brand-neutral p-6 md:p-14 xl:p-20 flex flex-col justify-start">
          {/* SELETTORE INTERATTIVO A SCHEDE (TAB) */}
          <div className="flex bg-white p-1.5 rounded-2xl mb-8 max-w-xl mx-auto w-full shadow-sm border border-brand-border">
            <button
              type="button"
              onClick={() => {
                setActiveTab("mediazione");
                setMediationError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === "mediazione"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-brand-primary hover:bg-brand-neutral"
              }`}
            >
              <Scale size={16} />
              Richiesta di Mediazione ADR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("generale")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === "generale"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-brand-primary hover:bg-brand-neutral"
              }`}
            >
              <Info size={16} />
              Informazioni Generali
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: WIZARD MULTI-STEP MEDIAZIONE                        */}
          {/* ======================================================== */}
          {activeTab === "mediazione" && (
            <div className="max-w-2xl mx-auto w-full">
              {mediationSuccessProtocol ? (
                // SCHERMATA DI DEPOSITO CONCLUSO CON PROTOCOLLO
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-lg border border-gray-100 space-y-6 my-auto"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Domanda di Mediazione Depositata!</h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    La tua richiesta è stata registrata con successo. Conserva il seguente numero di protocollo ufficiale per qualsiasi comunicazione con la segreteria I.Me.Con:
                  </p>
                  <div className="bg-brand-neutral/80 border border-brand-primary/30 rounded-xl p-4 inline-block font-mono text-xl font-bold text-brand-primary tracking-wider">
                    {mediationSuccessProtocol}
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMediationSuccessProtocol(null);
                        setStep(1);
                        setControversyFiles([]);
                      }}
                      className="px-6 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-all shadow-sm"
                    >
                      Invia una nuova pratica
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* BARRA PROGRESSIVA DEGLI STEP */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      <span className={step >= 1 ? "text-brand-primary font-bold" : ""}>1. Lite & Documenti</span>
                      <span className={step >= 2 ? "text-brand-primary font-bold" : ""}>2. Istante</span>
                      <span className={step >= 3 ? "text-brand-primary font-bold" : ""}>3. Convenuto</span>
                      <span className={step >= 4 ? "text-brand-primary font-bold" : ""}>4. Riepilogo</span>
                    </div>
                    <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-primary h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(step / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                  {mediationError && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-center gap-3">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{mediationError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitMediation} className="space-y-6">
                    {/* STEP 1: DATI CONTROVERSIA E UPLOAD DOCUMENTI */}
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="border-b border-brand-border pb-3">
                          <h3 className="text-xl font-chillax font-semibold text-brand-dark">Dati della Controversia & Documenti</h3>
                          <p className="text-xs text-brand-muted mt-1">
                            Seleziona la materia ministeriale e allega in questa sezione i documenti relativi alla lite.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Sede Competente *
                            </label>
                            <select
                              name="areaId"
                              value={mediationData.areaId}
                              onChange={handleMediationChange}
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            >
                              {aree.map((a) => (
                                <option key={a.id} value={a.id.toString()}>
                                  {a.nomeArea}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Materia / Oggetto *
                            </label>
                            <select
                              name="materia"
                              value={mediationData.materia}
                              onChange={handleMediationChange}
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            >
                              <option value="">Seleziona Materia...</option>
                              <option value="Condominio">Condominio</option>
                              <option value="Diritti Reali">Diritti Reali</option>
                              <option value="Divisione">Divisione</option>
                              <option value="Successioni Ereditarie">Successioni Ereditarie</option>
                              <option value="Patti di Famiglia">Patti di Famiglia</option>
                              <option value="Locazione">Locazione</option>
                              <option value="Comodato">Comodato</option>
                              <option value="Affitto di Aziende">Affitto di Aziende</option>
                              <option value="Risarcimento Danni">Risarcimento Danni (medica/sanitaria ecc.)</option>
                              <option value="Contratti Assicurativi/Bancari">Contratti Assicurativi e Bancari</option>
                              <option value="Altro civile/commerciale">Altro (Civile o Commerciale)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Valore Stimato della Lite (€)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              name="valore"
                              disabled={mediationData.valoreIndeterminato === "true"}
                              value={mediationData.valore}
                              onChange={handleMediationChange}
                              placeholder="es. 15000.00"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-50"
                            />
                          </div>
                          <div className="flex items-center gap-3 pt-4">
                            <input
                              type="checkbox"
                              id="valoreIndeterminato"
                              checked={mediationData.valoreIndeterminato === "true"}
                              onChange={(e) =>
                                setMediationData((prev) => ({
                                  ...prev,
                                  valoreIndeterminato: e.target.checked ? "true" : "false",
                                  valore: e.target.checked ? "0.00" : prev.valore,
                                }))
                              }
                              className="w-4 h-4 text-brand-primary rounded border-brand-border focus:ring-brand-primary"
                            />
                            <label htmlFor="valoreIndeterminato" className="text-sm font-medium text-brand-dark cursor-pointer">
                              Valore Indeterminato / Non Quantificabile
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                            Sintesi e Descrizione dei Fatti *
                          </label>
                          <textarea
                            name="descrizioneFatti"
                            rows={4}
                            value={mediationData.descrizioneFatti}
                            onChange={handleMediationChange}
                            placeholder="Descrivi chiaramente i motivi del contendere e le pretese dell'Istante..."
                            className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                          />
                        </div>

                        {/* CARICAMENTO FILE ESCLUSIVAMENTE PER DATI CONTROVERSIA */}
                        <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-brand-primary uppercase">
                              Allegati della Controversia (Istanza / Contratti / Diffide)
                            </label>
                            <span className="text-[11px] text-brand-muted">Salvataggio Sicuro Locale su Server</span>
                          </div>

                          <label className="border-2 border-dashed border-brand-primary/30 hover:border-brand-primary rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-brand-neutral/40">
                            <Upload size={28} className="text-brand-primary mb-2" />
                            <span className="text-sm font-semibold text-brand-dark">
                              Clicca per selezionare i documenti della lite
                            </span>
                            <span className="text-xs text-brand-muted mt-1">
                              Formati consentiti: PDF, DOC, DOCX, JPG, PNG, P7M (Max 10 MB per file)
                            </span>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.p7m"
                            />
                          </label>

                          {controversyFiles.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <p className="text-xs font-semibold text-brand-dark">File selezionati ({controversyFiles.length}):</p>
                              {controversyFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-brand-neutral px-3 py-2 rounded-lg text-xs border border-brand-border"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText size={15} className="text-brand-primary shrink-0" />
                                    <span className="font-medium text-brand-dark truncate">{file.name}</span>
                                    <span className="text-brand-muted">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                    title="Rimuovi file"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: ISTANTE & AVVOCATO */}
                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="border-b border-brand-border pb-3">
                          <h3 className="text-xl font-chillax font-semibold text-brand-dark">Dati dell&apos;Istante (Chi introduce la mediazione)</h3>
                          <p className="text-xs text-brand-muted mt-1">
                            Inserisci i dati anagrafici e i recapiti ufficiali dell&apos;Istante.
                          </p>
                        </div>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-brand-dark">
                            <input
                              type="radio"
                              name="istanteTipo"
                              value="PF"
                              checked={mediationData.istanteTipo === "PF"}
                              onChange={handleMediationChange}
                              className="text-brand-primary border-brand-border focus:ring-brand-primary"
                            />
                            Persona Fisica
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-brand-dark">
                            <input
                              type="radio"
                              name="istanteTipo"
                              value="PG"
                              checked={mediationData.istanteTipo === "PG"}
                              onChange={handleMediationChange}
                              className="text-brand-primary border-brand-border focus:ring-brand-primary"
                            />
                            Persona Giuridica / Società / Condominio
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              {mediationData.istanteTipo === "PF" ? "Nome e Cognome *" : "Ragione Sociale *"}
                            </label>
                            <input
                              type="text"
                              name="istanteDenominazione"
                              value={mediationData.istanteDenominazione}
                              onChange={handleMediationChange}
                              placeholder={mediationData.istanteTipo === "PF" ? "Mario Rossi" : "Condominio Via Roma 10"}
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Codice Fiscale / P.IVA *
                            </label>
                            <input
                              type="text"
                              name="istanteCodiceFiscale"
                              value={mediationData.istanteCodiceFiscale}
                              onChange={handleMediationChange}
                              placeholder="RSSMRA80A01H501Z oppure 01234567890"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 uppercase"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Data Nascita / Costituzione *
                            </label>
                            <input
                              type="date"
                              name="istanteDataNascita"
                              value={mediationData.istanteDataNascita}
                              onChange={handleMediationChange}
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Email di Contatto / PEC *
                            </label>
                            <input
                              type="email"
                              name="istanteEmail"
                              value={mediationData.istanteEmail}
                              onChange={handleMediationChange}
                              placeholder="mario.rossi@email.it"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">Telefono</label>
                            <input
                              type="tel"
                              name="istanteTelefono"
                              value={mediationData.istanteTelefono}
                              onChange={handleMediationChange}
                              placeholder="333 1234567"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>
                        </div>

                        {/* RESIDENZA / SEDE LEGALE */}
                        <div className="bg-brand-neutral/60 p-4 rounded-xl border border-brand-border space-y-3">
                          <p className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                            {mediationData.istanteTipo === "PF" ? "Indirizzo di Residenza" : "Sede Legale"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-5">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">Indirizzo (Via/Piazza, n° civico) *</label>
                              <input
                                type="text"
                                name="istanteIndirizzo"
                                value={mediationData.istanteIndirizzo}
                                onChange={handleMediationChange}
                                placeholder="Via Roma 10"
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                            <div className="md:col-span-4">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">Comune *</label>
                              <input
                                type="text"
                                name="istanteComune"
                                value={mediationData.istanteComune}
                                onChange={handleMediationChange}
                                placeholder="Roma"
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">CAP *</label>
                              <input
                                type="text"
                                name="istanteCap"
                                value={mediationData.istanteCap}
                                onChange={handleMediationChange}
                                placeholder="00100"
                                maxLength={5}
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">Provincia *</label>
                              <input
                                type="text"
                                name="istanteProvincia"
                                value={mediationData.istanteProvincia}
                                onChange={handleMediationChange}
                                placeholder="RM"
                                maxLength={3}
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs uppercase outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                          </div>
                        </div>

                        {/* ASSISTENZA LEGALE AVVOCATO */}
                        <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-brand-dark">Sei assistito da un Avvocato?</span>
                            <select
                              name="haAvvocato"
                              value={mediationData.haAvvocato}
                              onChange={handleMediationChange}
                              className="bg-brand-neutral px-3 py-1.5 rounded-lg text-xs font-bold text-brand-primary border border-brand-border"
                            >
                              <option value="false">No</option>
                              <option value="true">Sì, aggiungi Avvocato</option>
                            </select>
                          </div>

                          {mediationData.haAvvocato === "true" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                              <div>
                                <label className="block text-xs font-semibold text-brand-muted mb-1">Nome Avvocato *</label>
                                <input
                                  type="text"
                                  name="avvocatoNome"
                                  value={mediationData.avvocatoNome}
                                  onChange={handleMediationChange}
                                  placeholder="Avv. Luigi Bianchi"
                                  className="w-full bg-brand-neutral/50 border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-brand-muted mb-1">Codice Fiscale Avv. *</label>
                                <input
                                  type="text"
                                  name="avvocatoCodiceFiscale"
                                  value={mediationData.avvocatoCodiceFiscale}
                                  onChange={handleMediationChange}
                                  placeholder="BNCLGU75..."
                                  className="w-full bg-brand-neutral/50 border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs uppercase outline-none focus:ring-2 focus:ring-brand-primary/30"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-brand-muted mb-1">PEC Avvocato *</label>
                                <input
                                  type="email"
                                  name="avvocatoEmail"
                                  value={mediationData.avvocatoEmail}
                                  onChange={handleMediationChange}
                                  placeholder="avv.bianchi@pec.it"
                                  className="w-full bg-brand-neutral/50 border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: CONVENUTO */}
                    {step === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                        <div className="border-b border-brand-border pb-3">
                          <h3 className="text-xl font-chillax font-semibold text-brand-dark">Dati del Convenuto (La controparte chiamata)</h3>
                          <p className="text-xs text-brand-muted mt-1">
                            Inserisci i dati e l&apos;indirizzo di notifica per convocare la controparte al procedimento di mediazione.
                          </p>
                        </div>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-brand-dark">
                            <input
                              type="radio"
                              name="convenutoTipo"
                              value="PF"
                              checked={mediationData.convenutoTipo === "PF"}
                              onChange={handleMediationChange}
                              className="text-brand-primary border-brand-border focus:ring-brand-primary"
                            />
                            Persona Fisica
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-brand-dark">
                            <input
                              type="radio"
                              name="convenutoTipo"
                              value="PG"
                              checked={mediationData.convenutoTipo === "PG"}
                              onChange={handleMediationChange}
                              className="text-brand-primary border-brand-border focus:ring-brand-primary"
                            />
                            Persona Giuridica / Impresa
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Denominazione Convenuto *
                            </label>
                            <input
                              type="text"
                              name="convenutoDenominazione"
                              value={mediationData.convenutoDenominazione}
                              onChange={handleMediationChange}
                              placeholder="Nome Cognome o Società Controparte"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Codice Fiscale / P.IVA (Se noto)
                            </label>
                            <input
                              type="text"
                              name="convenutoCodiceFiscale"
                              value={mediationData.convenutoCodiceFiscale}
                              onChange={handleMediationChange}
                              placeholder="CF o P.IVA controparte"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 uppercase"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Data Nascita / Costituzione *
                            </label>
                            <input
                              type="date"
                              name="convenutoDataNascita"
                              value={mediationData.convenutoDataNascita}
                              onChange={handleMediationChange}
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">
                              Email / PEC Notifica *
                            </label>
                            <input
                              type="email"
                              name="convenutoEmail"
                              value={mediationData.convenutoEmail}
                              onChange={handleMediationChange}
                              placeholder="controparte@pec.it o email"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-brand-dark uppercase mb-1">Telefono Convenuto</label>
                            <input
                              type="tel"
                              name="convenutoTelefono"
                              value={mediationData.convenutoTelefono}
                              onChange={handleMediationChange}
                              placeholder="Recapito controparte"
                              className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                          </div>
                        </div>

                        {/* RESIDENZA / SEDE LEGALE CONVENUTO */}
                        <div className="bg-brand-neutral/60 p-4 rounded-xl border border-brand-border space-y-3">
                          <p className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                            {mediationData.convenutoTipo === "PF" ? "Indirizzo di Residenza Convenuto" : "Sede Legale Convenuto"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-5">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">Indirizzo (Via/Piazza, n° civico) *</label>
                              <input
                                type="text"
                                name="convenutoIndirizzo"
                                value={mediationData.convenutoIndirizzo}
                                onChange={handleMediationChange}
                                placeholder="Via Milano 20"
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                            <div className="md:col-span-4">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">Comune *</label>
                              <input
                                type="text"
                                name="convenutoComune"
                                value={mediationData.convenutoComune}
                                onChange={handleMediationChange}
                                placeholder="Milano"
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">CAP *</label>
                              <input
                                type="text"
                                name="convenutoCap"
                                value={mediationData.convenutoCap}
                                onChange={handleMediationChange}
                                placeholder="20100"
                                maxLength={5}
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-[11px] font-bold text-brand-muted mb-1">Provincia *</label>
                              <input
                                type="text"
                                name="convenutoProvincia"
                                value={mediationData.convenutoProvincia}
                                onChange={handleMediationChange}
                                placeholder="MI"
                                maxLength={3}
                                className="w-full bg-white border border-brand-border text-brand-dark px-3 py-2 rounded-lg text-xs uppercase outline-none focus:ring-2 focus:ring-brand-primary/30"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: RIEPILOGO FINALE */}
                    {step === 4 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="border-b border-brand-border pb-3">
                          <h3 className="text-xl font-chillax font-semibold text-brand-dark">Riepilogo e Invio Istanza</h3>
                          <p className="text-xs text-brand-muted mt-1">
                            Controlla attentamente i dati inseriti e clicca sul pulsante sottostante per depositare la domanda.
                          </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-2 border-b border-brand-border/60 pb-3">
                            <div>
                              <p className="text-brand-muted font-bold uppercase">Materia</p>
                              <p className="text-brand-dark font-semibold text-sm">{mediationData.materia}</p>
                            </div>
                            <div>
                              <p className="text-brand-muted font-bold uppercase">Valore Lite</p>
                              <p className="text-brand-dark font-semibold text-sm">
                                {mediationData.valoreIndeterminato === "true" ? "Indeterminato" : `€ ${mediationData.valore}`}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-b border-brand-border/60 pb-3">
                            <div>
                              <p className="text-brand-muted font-bold uppercase">Istante</p>
                              <p className="text-brand-dark font-semibold">{mediationData.istanteDenominazione}</p>
                              <p className="text-brand-muted">{mediationData.istanteEmail}</p>
                              {mediationData.istanteDataNascita && (
                                <p className="text-brand-muted text-[11px]">Nato/a il: {mediationData.istanteDataNascita}</p>
                              )}
                              {mediationData.istanteIndirizzo && (
                                <p className="text-brand-muted text-[11px]">
                                  Residenza/Sede: {mediationData.istanteIndirizzo}, {mediationData.istanteCap} {mediationData.istanteComune} ({mediationData.istanteProvincia})
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-brand-muted font-bold uppercase">Convenuto</p>
                              <p className="text-brand-dark font-semibold">{mediationData.convenutoDenominazione}</p>
                              <p className="text-brand-muted">{mediationData.convenutoEmail}</p>
                              {mediationData.convenutoDataNascita && (
                                <p className="text-brand-muted text-[11px]">Nato/a il: {mediationData.convenutoDataNascita}</p>
                              )}
                              {mediationData.convenutoIndirizzo && (
                                <p className="text-brand-muted text-[11px]">
                                  Residenza/Sede: {mediationData.convenutoIndirizzo}, {mediationData.convenutoCap} {mediationData.convenutoComune} ({mediationData.convenutoProvincia})
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-brand-muted font-bold uppercase mb-1">
                              Documenti Allegati in Dati Controversia ({controversyFiles.length})
                            </p>
                            {controversyFiles.length === 0 ? (
                              <p className="text-brand-muted italic">Nessun file allegato</p>
                            ) : (
                              <ul className="list-disc pl-5 space-y-1 text-brand-dark">
                                {controversyFiles.map((f, i) => (
                                  <li key={i}>
                                    {f.name} ({(f.size / 1024).toFixed(0)} KB)
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* PULSANTI AVANTI / INDIETRO / INVIO */}
                    <div className="flex justify-between items-center pt-6 border-t border-brand-border">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="px-6 py-2.5 rounded-xl border border-brand-border text-brand-dark font-medium text-sm flex items-center gap-2 hover:bg-brand-neutral transition-all"
                        >
                          <ArrowLeft size={16} />
                          Indietro
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 4 ? (
                        <button
                          key="btn-prosegui"
                          type="button"
                          onClick={nextStep}
                          className="px-8 py-3 rounded-xl bg-brand-primary text-white font-medium text-sm flex items-center gap-2 hover:bg-brand-dark transition-all shadow-md"
                        >
                          Prosegui
                          <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          key="btn-submit"
                          type="submit"
                          disabled={isSubmittingMediation}
                          className="px-10 py-3 rounded-xl bg-brand-primary text-white font-bold text-sm flex items-center gap-2 hover:bg-brand-dark disabled:bg-gray-400 transition-all shadow-lg"
                        >
                          {isSubmittingMediation ? "Deposito in corso..." : "Deposita Richiesta di Mediazione"}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: INFORMAZIONI GENERALI (FORM SEMPLICE)               */}
          {/* ======================================================== */}
          {activeTab === "generale" && (
            <div className="max-w-xl mx-auto w-full">
              <div className="mb-6">
                <h3 className="text-xl font-chillax font-semibold text-brand-dark">Richiedi Informazioni Generali</h3>
                <p className="text-xs text-brand-muted mt-1">
                  Hai domande sui nostri corsi o sulle tariffe di mediazione? Scrivici e ti risponderemo entro 24 ore.
                </p>
              </div>

              <form onSubmit={handleSubmitGeneral} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    placeholder="Nome *"
                    className="w-full bg-white text-brand-dark placeholder:text-brand-muted/60 px-5 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <input
                    required
                    type="text"
                    placeholder="Cognome *"
                    className="w-full bg-white text-brand-dark placeholder:text-brand-muted/60 px-5 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>

                <input
                  required
                  type="email"
                  placeholder="Indirizzo email *"
                  className="w-full bg-white text-brand-dark placeholder:text-brand-muted/60 px-5 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30"
                />

                <textarea
                  required
                  rows={5}
                  placeholder="Scrivi qui il tuo messaggio o quesito..."
                  className="w-full bg-white text-brand-dark placeholder:text-brand-muted/60 px-5 py-3 rounded-xl border border-brand-border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                />

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingGeneral || isSuccessGeneral}
                    className={`px-8 py-3 rounded-xl text-white font-medium text-sm transition-all shadow-md ${
                      isSuccessGeneral
                        ? "bg-green-600"
                        : isSubmittingGeneral
                        ? "bg-gray-400"
                        : "bg-brand-primary hover:bg-brand-dark"
                    }`}
                  >
                    {isSubmittingGeneral ? "Invio..." : isSuccessGeneral ? "Messaggio Inviato!" : "Invia Messaggio"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ===== IMMAGINE O MOTTO BOTTOM ===== */}
      <div className="w-full h-44 md:h-64 relative border-t-4 border-brand-accent overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <h2 className="text-2xl md:text-4xl font-bold font-chillax text-white tracking-widest drop-shadow-lg uppercase">
            La legge è uguale per tutti • I.Me.Con
          </h2>
        </div>
      </div>
    </section>
  );
};
