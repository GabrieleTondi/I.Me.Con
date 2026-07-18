"use client";

import { motion } from "framer-motion";
import { X, FileText, Users, Paperclip, Scale, Shield } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { prorogaMediationAction } from "@/app/actions/mediation-actions";
import { getMediationDeadline, getScadenzaStatus } from "@/lib/deadline-utils";

export interface CurrentUser {
  id: number;
  nomeCognome: string;
  email: string;
  username: string;
  ruoli: string[];
  areaIds: number[];
}

export interface SubjectInfo {
  ruoloNellaLite: string;
  soggetto: {
    denominazione: string;
    codiceFiscalePiva: string;
    dataNascita: string | null;
    indirizzoResidenza: string | null;
    comuneResidenza: string | null;
    capResidenza: string | null;
    provinciaResidenza: string | null;
    email: string | null;
    telefono: string | null;
  };
}

export interface DocumentInfo {
  id: number;
  nomeOriginale: string;
  dimensione: number;
  tipoMime: string;
}

export interface MediationInfo {
  id: number;
  protocollo: string;
  oggetto: string;
  valore: string;
  dataInserimento: string;
  stato: {
    codice: string;
    descrizione: string;
  };
  mediatore: {
    nomeCognome: string;
  } | null;
  area: {
    nomeArea: string;
  };
  areaId: number;
  prorogata: boolean;
  soggetti: SubjectInfo[];
  documenti: DocumentInfo[];
}

interface MediationDetailsModalProps {
  selectedMediation: MediationInfo;
  currentUser: CurrentUser;
  onClose: () => void;
  onUpdate?: () => void;
}

export const MediationDetailsModal = ({
  selectedMediation,
  currentUser,
  onClose,
  onUpdate,
}: MediationDetailsModalProps) => {
  const [prorogaChecked, setProrogaChecked] = useState(selectedMediation.prorogata);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if selected mediation changes
  useEffect(() => {
    setProrogaChecked(selectedMediation.prorogata);
    setErrorMsg(null);
  }, [selectedMediation]);

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString("it-IT");
  };

  const formatCurrency = (val: string | number) => {
    const parsed = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(parsed)) return "€ 0,00";
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(parsed);
  };

  const handleProrogaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked;
    setProrogaChecked(nextVal);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await prorogaMediationAction(selectedMediation.id, nextVal);
      if (!res.success) {
        setProrogaChecked(!nextVal); // Rollback
        setErrorMsg(res.error || "Errore nel salvataggio della proroga.");
      } else {
        if (onUpdate) {
          onUpdate();
        }
      }
    });
  };

  const isConclusa = [
    "ACCORDO_RAGGIUNTO",
    "ASSENZA_CONVENUTO",
    "ASSENZA_CONVENUTO_PROPOSTA",
    "MANCATO_ACCORDO",
    "ESTINTO_ASSENZA_PARTI",
    "ARCHIVIATA"
  ].includes(selectedMediation.stato.codice);

  // Ricalcola il bollino in tempo reale in base allo stato di proroga selezionato
  const scadenzaColor = getScadenzaStatus(selectedMediation.dataInserimento, prorogaChecked, isConclusa);
  const deadlineDate = getMediationDeadline(selectedMediation.dataInserimento, prorogaChecked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Sfondo Oscurato */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black cursor-pointer"
      />

      {/* Finestra Modale */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 relative overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Testata Modale */}
        <div className="bg-brand-primary text-white p-6 flex justify-between items-center relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">Scheda Pratica ADR</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                selectedMediation.stato.codice === "DA_ASSEGNARE" ? "bg-yellow-500 text-white" :
                selectedMediation.stato.codice === "IN_CORSO" ? "bg-blue-500 text-white" :
                selectedMediation.stato.codice === "ACCORDO_RAGGIUNTO" ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}>
                {selectedMediation.stato.descrizione}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-chillax mt-1 font-mono tracking-wide">
              {selectedMediation.protocollo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
            title="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Modale Scrollabile */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* 1. SEZIONE DATI CONTROVERSIA */}
          <div className="bg-brand-neutral p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Dettagli Controversia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase">Data Deposito</p>
                <p className="text-gray-800 font-semibold text-sm mt-0.5">
                  {formatDate(selectedMediation.dataInserimento)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase">Sede Competente</p>
                <p className="text-gray-800 font-semibold text-sm mt-0.5">
                  {selectedMediation.area.nomeArea}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase">Valore Stima</p>
                <p className="text-gray-800 font-bold text-sm mt-0.5">
                  {selectedMediation.valore === "0.00" ? "Indeterminato" : formatCurrency(selectedMediation.valore)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase">Mediatore Assegnato</p>
                <p className="text-gray-800 font-semibold text-sm mt-0.5">
                  {selectedMediation.mediatore ? selectedMediation.mediatore.nomeCognome : "Non ancora assegnato"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase">Scadenza Legale</p>
                <div className="text-gray-800 font-bold text-sm mt-0.5 flex items-center gap-1.5">
                  <span>{formatDate(deadlineDate.toISOString().split("T")[0])}</span>
                  {scadenzaColor && (
                    <span
                      className={`w-3.5 h-3.5 rounded-full inline-block border-2 border-white ${
                        scadenzaColor === "rosso" ? "bg-red-500 animate-pulse" :
                        scadenzaColor === "giallo" ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      title={`Scadenza: ${scadenzaColor.toUpperCase()}`}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200/60 pt-3">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Descrizione dei Fatti</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 whitespace-pre-line font-medium">
                {selectedMediation.oggetto}
              </p>
            </div>

            {/* SEZIONE PROROGA (Solo per Amministratori o Segreteria) */}
            {(currentUser.ruoli.includes("Amministratore") || currentUser.ruoli.includes("Segreteria")) ? (
              <div className="border-t border-gray-200/60 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-gray-800 font-bold text-xs uppercase flex items-center gap-1.5">
                    <Shield size={14} className="text-brand-secondary" />
                    Proroga Termini Procedimento
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Estende il termine perentorio di conclusione da 3 a 6 mesi complessivi.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={prorogaChecked}
                    disabled={isPending}
                    onChange={handleProrogaChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-secondary"></div>
                  <span className="ml-3 text-xs font-bold text-gray-700">
                    {prorogaChecked ? "Esteso (6 mesi)" : "Standard (3 mesi)"}
                  </span>
                </label>
              </div>
            ) : (
              <div className="border-t border-gray-200/60 pt-3 flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-400 font-bold uppercase">Stato Proroga</p>
                  <p className="text-gray-800 font-semibold mt-0.5">
                    {selectedMediation.prorogata
                      ? "Proroga a 6 mesi attiva (d'intesa con le parti)."
                      : "Termine standard a 3 mesi (nessuna proroga attiva)."}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedMediation.prorogata ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}>
                  {selectedMediation.prorogata ? "Prorogata" : "Standard"}
                </span>
              </div>
            )}
          </div>

          {/* 2. SEZIONE SOGGETTI COINVOLTI */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-2">
              <Users size={16} />
              Soggetti Coinvolti nella Lite
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PARTE ISTANTE */}
              <div className="border border-gray-100 p-4 rounded-xl space-y-3 bg-white">
                <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Parte Istante</h4>
                {selectedMediation.soggetti
                  .filter((s) => s.ruoloNellaLite.includes("Istante"))
                  .map((s, idx) => (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <p className="text-sm font-bold text-gray-900">{s.soggetto.denominazione}</p>
                      <p className="text-gray-500 font-semibold">Ruolo: {s.ruoloNellaLite}</p>
                      <p className="text-gray-500">Codice Fiscale/P.IVA: <strong className="font-mono text-gray-700">{s.soggetto.codiceFiscalePiva}</strong></p>
                      {s.soggetto.dataNascita && <p className="text-gray-500">Data Nascita/Costituzione: <span className="text-gray-700 font-medium">{s.soggetto.dataNascita}</span></p>}
                      {s.soggetto.indirizzoResidenza && (
                        <p className="text-gray-500">
                          Residenza/Sede: <span className="text-gray-700 font-medium">{s.soggetto.indirizzoResidenza}, {s.soggetto.capResidenza || ""} {s.soggetto.comuneResidenza || ""} ({s.soggetto.provinciaResidenza || ""})</span>
                        </p>
                      )}
                      {s.soggetto.email && <p className="text-gray-500">PEC/Email: <span className="text-brand-secondary font-semibold">{s.soggetto.email}</span></p>}
                      {s.soggetto.telefono && <p className="text-gray-500">Tel: {s.soggetto.telefono}</p>}
                    </div>
                  ))}
              </div>

              {/* PARTE CONVENUTO */}
              <div className="border border-gray-100 p-4 rounded-xl space-y-3 bg-white">
                <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Parte Convenuta</h4>
                {selectedMediation.soggetti
                  .filter((s) => s.ruoloNellaLite.includes("Convenuto"))
                  .map((s, idx) => (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <p className="text-sm font-bold text-gray-900">{s.soggetto.denominazione}</p>
                      <p className="text-gray-500 font-semibold">Ruolo: {s.ruoloNellaLite}</p>
                      <p className="text-gray-500">Codice Fiscale/P.IVA: <strong className="font-mono text-gray-700">{s.soggetto.codiceFiscalePiva}</strong></p>
                      {s.soggetto.dataNascita && <p className="text-gray-500">Data Nascita/Costituzione: <span className="text-gray-700 font-medium">{s.soggetto.dataNascita}</span></p>}
                      {s.soggetto.indirizzoResidenza && (
                        <p className="text-gray-500">
                          Residenza/Sede: <span className="text-gray-700 font-medium">{s.soggetto.indirizzoResidenza}, {s.soggetto.capResidenza || ""} {s.soggetto.comuneResidenza || ""} ({s.soggetto.provinciaResidenza || ""})</span>
                        </p>
                      )}
                      {s.soggetto.email && <p className="text-gray-500">PEC/Email: <span className="text-brand-secondary font-semibold">{s.soggetto.email}</span></p>}
                      {s.soggetto.telefono && <p className="text-gray-500">Tel: {s.soggetto.telefono}</p>}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 3. ALLEGATI DOCUMENTALI */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-2">
              <Paperclip size={16} />
              Documenti ed Allegati depositati ({selectedMediation.documenti.length})
            </h3>
            {selectedMediation.documenti.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nessun file allegato a questa pratica.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMediation.documenti.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/api/gestionale/documento?id=${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs hover:bg-brand-neutral hover:border-brand-secondary/30 transition-all cursor-pointer block"
                  >
                    <FileText size={20} className="text-brand-secondary shrink-0" />
                    <div className="truncate flex-1">
                      <p className="font-bold text-gray-800 truncate" title={doc.nomeOriginale}>
                        {doc.nomeOriginale}
                      </p>
                      <p className="text-gray-400 font-medium">
                        {(doc.dimensione / (1024 * 1024)).toFixed(2)} MB • {doc.tipoMime.split("/")[1]?.toUpperCase() || "File"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Piè di pagina Modale */}
        <div className="bg-brand-neutral p-4 border-t border-gray-100 flex justify-between items-center">
          <a
            href={`/api/gestionale/pdf-riassunto?id=${selectedMediation.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 text-xs font-bold bg-brand-secondary text-white rounded-xl hover:bg-brand-primary transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileText size={14} />
            Stampa / Scarica Riassunto PDF
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            Chiudi Dettagli
          </button>
        </div>
      </motion.div>
    </div>
  );
};
