"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft, Info, HelpCircle, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { getMediationDeadline, getScadenzaStatus } from "@/lib/deadline-utils";
import { MediationDetailsModal, MediationInfo, CurrentUser } from "@/components/gestionale/MediationDetailsModal";

interface CalendarioClientProps {
  initialMediazioni: MediationInfo[];
  user: CurrentUser;
}

export const CalendarioClient = ({ initialMediazioni, user }: CalendarioClientProps) => {
  const router = useRouter();
  const [mediazioni, setMediazioni] = useState<MediationInfo[]>(initialMediazioni);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateMediazioni, setSelectedDateMediazioni] = useState<{
    date: Date;
    starts: MediationInfo[];
    deadlines: MediationInfo[];
  } | null>(null);
  const [selectedMediation, setSelectedMediation] = useState<MediationInfo | null>(null);

  useEffect(() => {
    setMediazioni(initialMediazioni);
    if (selectedMediation) {
      const updated = initialMediazioni.find((m) => m.id === selectedMediation.id);
      if (updated) {
        setSelectedMediation(updated);
      }
    }
  }, [initialMediazioni]);

  // Calcolo dei giorni del mese
  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Giorno di inizio del mese (0 = Domenica, ..., 6 = Sabato)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Numero di giorni nel mese corrente
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Numero di giorni nel mese precedente
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // Spostiamo la partenza a Lunedì come standard italiano (0 = Lunedì, ..., 6 = Domenica)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Giorni del mese precedente per riempire la griglia
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Giorni del mese corrente
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Giorni del mese successivo per completare la griglia a multipli di 7
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Cambia mese
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDateMediazioni(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDateMediazioni(null);
  };

  // Mappatura delle pratiche che iniziano o scadono in un determinato giorno
  const getMediazioniForDay = (date: Date) => {
    const compareDateStr = date.toISOString().split("T")[0];

    const starts = mediazioni.filter((m) => m.dataInserimento === compareDateStr);

    const deadlines = mediazioni.filter((m) => {
      const isConclusa = [
        "ACCORDO_RAGGIUNTO",
        "ASSENZA_CONVENUTO",
        "ASSENZA_CONVENUTO_PROPOSTA",
        "MANCATO_ACCORDO",
        "ESTINTO_ASSENZA_PARTI",
        "ARCHIVIATA",
      ].includes(m.stato.codice);

      // Le scadenze visualizzate sono solo per le pratiche non concluse
      if (isConclusa) return false;

      const deadline = getMediationDeadline(m.dataInserimento, m.prorogata, m.scadenzaPersonalizzata);
      return deadline.toISOString().split("T")[0] === compareDateStr;
    });

    return { starts, deadlines };
  };

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* HEADER CALENDARIO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="space-y-1">
          <Link href="/gestionale">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer mb-2">
              <ArrowLeft size={14} />
              Torna al Gestionale
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-secondary/10 text-brand-secondary rounded-xl">
              <Calendar size={28} />
            </div>
            <h1 className="text-3xl font-chillax font-bold text-gray-900 tracking-wide">
              Calendario Scadenze ADR
            </h1>
          </div>
          <p className="text-xs text-gray-500 max-w-xl">
            Visualizza le scadenze e gli avvii delle procedure di mediazione. Clicca sulle celle contrassegnate per consultare o prorogare le scadenze.
          </p>
        </div>

        {/* Legenda Colori */}
        <div className="bg-brand-neutral p-4 rounded-xl border border-brand-border space-y-2 text-xs font-semibold text-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
            <span>Bollino Verde: Data di avvio procedura</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full inline-block" />
            <span>Bollino Rosso: Data limite di scadenza (6/12 mesi)</span>
          </div>
        </div>
      </div>

      {/* CONTROLLO MESE */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="p-2.5 hover:bg-brand-neutral rounded-xl border border-gray-100 text-gray-600 transition-all cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold font-chillax text-gray-900 tracking-wider">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2.5 hover:bg-brand-neutral rounded-xl border border-gray-100 text-gray-600 transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* GRIGLIA CALENDARIO */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {/* Nomi dei giorni della settimana */}
        <div className="grid grid-cols-7 bg-brand-neutral border-b border-gray-100 text-center py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mer</div>
          <div>Gio</div>
          <div>Ven</div>
          <div>Sab</div>
          <div>Dom</div>
        </div>

        {/* Celle del Calendario */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {monthInfo.map((day, idx) => {
            const { starts, deadlines } = getMediazioniForDay(day.date);
            const hasDots = starts.length > 0 || deadlines.length > 0;
            const isToday = new Date().toDateString() === day.date.toDateString();

            return (
              <div
                key={idx}
                onClick={() => {
                  if (hasDots) {
                    setSelectedDateMediazioni({
                      date: day.date,
                      starts,
                      deadlines,
                    });
                  }
                }}
                className={`min-h-[100px] p-2 flex flex-col justify-between transition-all select-none ${
                  day.isCurrentMonth ? "bg-white text-gray-900" : "bg-gray-50 text-gray-400"
                } ${hasDots ? "hover:bg-brand-neutral/60 cursor-pointer" : ""} ${
                  isToday ? "ring-2 ring-brand-secondary ring-inset" : ""
                }`}
              >
                {/* Numero Giorno */}
                <span className={`text-xs font-bold p-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-brand-secondary text-white" : ""
                }`}>
                  {day.date.getDate()}
                </span>

                {/* Bollini Scadenza / Avvio */}
                <div className="flex gap-1.5 flex-wrap pt-2">
                  {starts.length > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-200 flex items-center gap-1 shadow-sm"
                      title={`${starts.length} Avvii`}
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {starts.length} {starts.length === 1 ? "Avvio" : "Avvii"}
                    </span>
                  )}
                  {deadlines.length > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-200 flex items-center gap-1 shadow-sm animate-pulse"
                      title={`${deadlines.length} Scadenze`}
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {deadlines.length} {deadlines.length === 1 ? "Scadenza" : "Scadenze"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP OVERLAY: Lista Mediazioni del Giorno */}
      <AnimatePresence>
        {selectedDateMediazioni && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div
              onClick={() => setSelectedDateMediazioni(null)}
              className="absolute inset-0 bg-black/40 cursor-pointer"
            />
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 relative z-10 overflow-hidden">
              <div className="bg-brand-primary text-white p-4 flex justify-between items-center">
                <h3 className="font-chillax font-bold text-lg">
                  Mediazioni del {selectedDateMediazioni.date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() => setSelectedDateMediazioni(null)}
                  className="p-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Sezione Avvii */}
                {selectedDateMediazioni.starts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 self-start inline-block">
                      Avvii di Procedura (Bollino Verde)
                    </p>
                    <div className="space-y-2">
                      {selectedDateMediazioni.starts.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMediation(m);
                            setSelectedDateMediazioni(null);
                          }}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-secondary/30 hover:bg-brand-neutral cursor-pointer transition-all space-y-1 text-xs"
                        >
                          <p className="font-bold text-brand-secondary font-mono text-sm">{m.protocollo}</p>
                          <p className="text-gray-700 font-semibold truncate">{m.oggetto}</p>
                          <p className="text-gray-400 font-medium">Sede: {m.area.nomeArea}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sezione Scadenze */}
                {selectedDateMediazioni.deadlines.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 self-start inline-block">
                      Scadenze Legali (Bollino Rosso)
                    </p>
                    <div className="space-y-2">
                      {selectedDateMediazioni.deadlines.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMediation(m);
                            setSelectedDateMediazioni(null);
                          }}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-secondary/30 hover:bg-brand-neutral cursor-pointer transition-all space-y-1 text-xs"
                        >
                          <p className="font-bold text-red-600 font-mono text-sm">{m.protocollo}</p>
                          <p className="text-gray-700 font-semibold truncate">{m.oggetto}</p>
                          <p className="text-gray-400 font-medium">Sede: {m.area.nomeArea} • Prorogata: {m.prorogata ? "Sì (6 mesi)" : "No (3 mesi)"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DETTAGLI MODALE DI VAI AI DETTAGLI */}
      <AnimatePresence>
        {selectedMediation && (
          <MediationDetailsModal
            selectedMediation={selectedMediation}
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
