"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { getScadenzaStatus } from "@/lib/deadline-utils";
import { MediationDetailsModal } from "@/components/gestionale/MediationDetailsModal";

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
  areaId: number;
  prorogata: boolean;
  soggetti: SubjectDetail[];
  documenti: DocumentDetail[];
}

interface GestionaleClientProps {
  initialMediazioni: MediationData[];
  user: {
    id: number;
    nomeCognome: string;
    email: string;
    username: string;
    ruoli: string[];
    areaIds: number[];
  };
}

export const GestionaleClient = ({ initialMediazioni, user }: GestionaleClientProps) => {
  const router = useRouter();
  const [mediazioni, setMediazioni] = useState<MediationData[]>(initialMediazioni);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedStato, setSelectedStato] = useState("all");
  const [selectedMediation, setSelectedMediation] = useState<MediationData | null>(null);

  useEffect(() => {
    setMediazioni(initialMediazioni);
    if (selectedMediation) {
      const updated = initialMediazioni.find((m) => m.id === selectedMediation.id);
      if (updated) {
        setSelectedMediation(updated);
      }
    }
  }, [initialMediazioni]);

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/gestionale/calendario">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-brand-secondary text-white hover:bg-brand-primary rounded-xl transition-all shadow-md cursor-pointer">
              <Calendar size={16} />
              Calendario Scadenze
            </span>
          </Link>
          <div className="flex items-center gap-2 bg-brand-neutral px-4 py-2.5 rounded-xl border border-brand-border shadow-sm">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">
              Connesso come <strong className="text-brand-secondary">{user.nomeCognome}</strong> ({user.ruoli.join(", ")})
            </span>
          </div>
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
                      <div className="flex items-center gap-2">
                        <span>{formatDate(m.dataInserimento)}</span>
                        {(() => {
                          const isConclusa = [
                            "ACCORDO_RAGGIUNTO",
                            "ASSENZA_CONVENUTO",
                            "ASSENZA_CONVENUTO_PROPOSTA",
                            "MANCATO_ACCORDO",
                            "ESTINTO_ASSENZA_PARTI",
                            "ARCHIVIATA"
                          ].includes(m.stato.codice);
                          const scadenzaColor = getScadenzaStatus(m.dataInserimento, m.prorogata, isConclusa);
                          if (!scadenzaColor) return null;
                          return (
                            <span
                              className={`w-2.5 h-2.5 rounded-full inline-block border border-white/50 ${
                                scadenzaColor === "rosso" ? "bg-red-500 animate-pulse" :
                                scadenzaColor === "giallo" ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              title={
                                scadenzaColor === "rosso" ? "Scadenza imminente (< 10 giorni) o Scaduto!" :
                                scadenzaColor === "giallo" ? "Oltre 60 giorni trascorsi" : "Regolare"
                              }
                            />
                          );
                        })()}
                      </div>
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
          <MediationDetailsModal
            selectedMediation={selectedMediation as any}
            currentUser={user}
            onClose={() => setSelectedMediation(null)}
            onUpdate={() => {
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
