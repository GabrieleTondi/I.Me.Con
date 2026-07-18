"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Activity,
  FileText,
  Users,
  Paperclip,
  X,
  TrendingUp,
  Scale,
  Clock,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";

interface SubjectDetail {
  ruoloNellaLite: string;
  soggetto: {
    id: number;
    tipoSoggetto: string;
    denominazione: string;
    codiceFiscalePiva: string;
    email: string | null;
    telefono: string | null;
    dataNascita?: string | null;
    indirizzoResidenza?: string | null;
    comuneResidenza?: string | null;
    capResidenza?: string | null;
    provinciaResidenza?: string | null;
  };
}

interface DocumentDetail {
  id: number;
  nomeFile: string;
  nomeOriginale: string;
  tipoMime: string;
  dimensione: number;
  dataCaricamento: string;
}

interface MediationData {
  id: number;
  protocollo: string;
  oggetto: string;
  valore: string;
  dataInserimento: string;
  stato: {
    id: number;
    codice: string;
    descrizione: string;
  };
  area: {
    id: number;
    nomeArea: string;
  };
  mediatore: {
    id: number;
    nomeCognome: string;
    email: string;
  } | null;
  soggetti: SubjectDetail[];
  documenti: DocumentDetail[];
}

interface GestionaleClientProps {
  initialMediazioni: MediationData[];
  user: {
    id: number;
    nomeCognome: string;
    email: string;
    ruoli: string[];
  };
}

export const GestionaleClient = ({ initialMediazioni, user }: GestionaleClientProps) => {
  const [mediazioni] = useState<MediationData[]>(initialMediazioni);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedStato, setSelectedStato] = useState("all");
  const [selectedMediation, setSelectedMediation] = useState<MediationData | null>(null);

  // Calcolo delle statistiche globali
  const stats = useMemo(() => {
    const total = mediazioni.length;
    const pending = mediazioni.filter((m) => m.stato.codice === "DA_ASSEGNARE").length;
    const inProgress = mediazioni.filter((m) => m.stato.codice === "IN_CORSO").length;
    const completed = mediazioni.filter((m) => 
      ["ACCORDO_RAGGIUNTO", "ASSENZA_CONVENUTO", "ASSENZA_CONVENUTO_PROPOSTA", "MANCATO_ACCORDO", "ESTINTO_ASSENZA_PARTI", "ARCHIVIATA"].includes(m.stato.codice)
    ).length;

    const totalValue = mediazioni.reduce((sum, m) => {
      const val = parseFloat(m.valore);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return { total, pending, inProgress, completed, totalValue };
  }, [mediazioni]);

  // Sedi uniche e stati unici presenti nei dati per i filtri
  const areeDisponibili = useMemo(() => {
    const set = new Set(mediazioni.map((m) => m.area.nomeArea));
    return Array.from(set);
  }, [mediazioni]);

  const statiDisponibili = useMemo(() => {
    const map = new Map<string, string>();
    mediazioni.forEach((m) => {
      map.set(m.stato.codice, m.stato.descrizione);
    });
    return Array.from(map.entries());
  }, [mediazioni]);

  // Filtro delle mediazioni in tempo reale
  const filteredMediazioni = useMemo(() => {
    return mediazioni.filter((m) => {
      // Filtro ricerca testuale (Protocollo, Oggetto/Materia o Denominazione Soggetti)
      const matchesSearch = 
        m.protocollo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.oggetto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.soggetti.some((s) => s.soggetto.denominazione.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro sede
      const matchesArea = selectedArea === "all" || m.area.nomeArea === selectedArea;

      // Filtro stato
      const matchesStato = selectedStato === "all" || m.stato.codice === selectedStato;

      return matchesSearch && matchesArea && matchesStato;
    });
  }, [mediazioni, searchTerm, selectedArea, selectedStato]);

  const getStatoBadgeClass = (codice: string) => {
    switch (codice) {
      case "DA_ASSEGNARE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "IN_CORSO":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ACCORDO_RAGGIUNTO":
        return "bg-green-100 text-green-800 border-green-200";
      case "ASSENZA_CONVENUTO":
      case "ASSENZA_CONVENUTO_PROPOSTA":
      case "MANCATO_ACCORDO":
        return "bg-red-100 text-red-800 border-red-200";
      case "ESTINTO_ASSENZA_PARTI":
      case "ARCHIVIATA":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Formatta importi in valuta Euro
  const formatCurrency = (val: string | number) => {
    const parsed = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(parsed)) return "€ 0,00";
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(parsed);
  };

  // Formatta data
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Data in formato YYYY-MM-DD
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString("it-IT");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* HEADER DELLA PAGINA */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-secondary/10 text-brand-secondary rounded-xl">
              <FileSpreadsheet size={28} />
            </div>
            <h1 className="text-3xl font-chillax font-bold text-gray-900 tracking-wide">
              Gestione Pratiche ADR
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {user.ruoli.includes("Amministratore") && "Pannello di controllo dell'Amministratore per la visualizzazione di tutte le domande di mediazione."}
            {!user.ruoli.includes("Amministratore") && user.ruoli.includes("Segreteria") && "Pannello di controllo della Segreteria per le domande di mediazione di competenza geografica."}
            {!user.ruoli.includes("Amministratore") && !user.ruoli.includes("Segreteria") && user.ruoli.includes("Mediatore") && "Pannello di controllo del Mediatore per le pratiche assegnate in carico."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-brand-neutral px-4 py-2.5 rounded-xl border border-brand-border self-start md:self-auto shadow-sm">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-gray-700">
            Connesso come <strong className="text-brand-secondary">{user.nomeCognome}</strong> ({user.ruoli.join(", ")})
          </span>
        </div>
      </div>

      {/* BLOCCO CARD STATISTICHE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Totale */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Totale Pratiche</span>
            <Scale size={20} className="text-brand-secondary" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-chillax">{stats.total}</h3>
            <p className="text-[10px] text-gray-500 mt-1">Domande depositate nel sistema</p>
          </div>
        </motion.div>

        {/* Valore Totale */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Valore Gestito</span>
            <TrendingUp size={20} className="text-brand-secondary" />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900 font-chillax truncate">
              {formatCurrency(stats.totalValue)}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">Valore economico totale delle liti</p>
          </div>
        </motion.div>

        {/* Da Assegnare */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Da Assegnare</span>
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-chillax">{stats.pending}</h3>
            <p className="text-[10px] text-gray-500 mt-1">Nuove istanze senza mediatore</p>
          </div>
        </motion.div>

        {/* In Corso */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">In Procedimento</span>
            <Activity size={20} className="text-blue-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-chillax">{stats.inProgress}</h3>
            <p className="text-[10px] text-gray-500 mt-1">Mediazioni attualmente in corso</p>
          </div>
        </motion.div>

        {/* Concluse */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Concluse / Archiviate</span>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-chillax">{stats.completed}</h3>
            <p className="text-[10px] text-gray-500 mt-1">Pratiche con accordo, fallite o archiviate</p>
          </div>
        </motion.div>
      </div>

      {/* FILTRI DI RICERCA */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        {/* Input Testuale */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per protocollo, oggetto, o nome soggetti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-brand-neutral border border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-brand-secondary/30 focus:ring-2 focus:ring-brand-secondary/10 transition-all text-gray-800 placeholder:text-gray-400"
          />
        </div>

        {/* Selezione Sede */}
        <div className="relative w-full md:w-48">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-brand-neutral border border-transparent rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-brand-secondary/30 transition-all text-gray-700 appearance-none cursor-pointer"
          >
            <option value="all">Tutte le Sedi</option>
            {areeDisponibili.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Selezione Stato */}
        <div className="relative w-full md:w-56">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedStato}
            onChange={(e) => setSelectedStato(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-brand-neutral border border-transparent rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-brand-secondary/30 transition-all text-gray-700 appearance-none cursor-pointer"
          >
            <option value="all">Tutti gli Stati</option>
            {statiDisponibili.map(([code, desc]) => (
              <option key={code} value={code}>
                {desc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABELLA DATI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-neutral border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4.5">Protocollo</th>
                <th className="px-6 py-4.5">Data Deposito</th>
                <th className="px-6 py-4.5">Sede</th>
                <th className="px-6 py-4.5">Oggetto / Materia</th>
                <th className="px-6 py-4.5">Valore</th>
                <th className="px-6 py-4.5">Stato</th>
                <th className="px-6 py-4.5">Mediatore</th>
                <th className="px-6 py-4.5 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
              {filteredMediazioni.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                    Nessuna pratica di mediazione corrisponde ai criteri di ricerca.
                  </td>
                </tr>
              ) : (
                filteredMediazioni.map((m) => (
                  <tr key={m.id} className="hover:bg-brand-neutral/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-brand-secondary font-bold">
                      {m.protocollo}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(m.dataInserimento)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        <span>{m.area.nomeArea}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-gray-700" title={m.oggetto}>
                        {m.oggetto}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">
                      {m.valore === "0.00" ? (
                        <span className="text-xs text-gray-400 italic">Indeterminato</span>
                      ) : (
                        formatCurrency(m.valore)
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatoBadgeClass(m.stato.codice)}`}>
                        {m.stato.descrizione}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {m.mediatore ? (
                        <span className="text-gray-800">{m.mediatore.nomeCognome}</span>
                      ) : (
                        <span className="text-yellow-600 italic bg-yellow-50 px-2 py-0.5 rounded">Da assegnare</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMediation(m)}
                        className="px-4 py-2 text-xs font-bold bg-brand-secondary text-white hover:bg-brand-primary rounded-lg transition-all shadow-sm hover:shadow"
                      >
                        Vedi Dettagli
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-brand-neutral px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
          <span>Mostrate {filteredMediazioni.length} di {mediazioni.length} pratiche totali</span>
          <span>Sedi Attive: {areeDisponibili.join(", ")}</span>
        </div>
      </div>

      {/* OVERLAY / MODAL DETTAGLI PRATICA */}
      <AnimatePresence>
        {selectedMediation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Sfondo Oscurato */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMediation(null)}
              className="absolute inset-0 bg-black"
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedMediation.stato.codice === "DA_ASSEGNARE" ? "bg-yellow-500 text-white" : "bg-brand-accent text-white"
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
                  onClick={() => setSelectedMediation(null)}
                  className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                  title="Chiudi"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Corpo Modale Scrollabile */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* 1. SEZIONE DATI CONTROVERSIA */}
                <div className="bg-brand-neutral p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} />
                    Dettagli Controversia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
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
                  </div>
                  <div className="border-t border-gray-200/60 pt-3">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Descrizione dei Fatti</p>
                    <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 whitespace-pre-line font-medium">
                      {selectedMediation.oggetto}
                    </p>
                  </div>
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
                  onClick={() => setSelectedMediation(null)}
                  className="px-6 py-2.5 text-xs font-bold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Chiudi Dettagli
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
