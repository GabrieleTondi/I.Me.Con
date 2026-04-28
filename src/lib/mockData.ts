export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  imageUrl: string;
}

export const MOCK_NEWS: NewsItem[] = [
  { id: "1", title: "La Riforma Cartabia: le novità per la Mediazione Civile", excerpt: "Analizziamo le recenti modifiche introdotte dalla Riforma Cartabia e il loro impatto sui procedimenti di mediazione obbligatoria.", content: "", category: "Riforma Cartabia", date: "15 Aprile 2026", imageUrl: "/italia.webp" },
  { id: "2", title: "Come prepararsi al primo incontro di Mediazione", excerpt: "I consigli dei nostri mediatori per affrontare al meglio il primo incontro formale tra le parti coinvolte.", content: "", category: "Mediazione Civile", date: "10 Aprile 2026", imageUrl: "/italia.webp" },
  { id: "3", title: "Mediazione Familiare: un ponte per ripartire", excerpt: "Scopri come la mediazione familiare può aiutare a gestire conflitti intrafamiliari in modo pacifico e costruttivo.", content: "", category: "Diritto di Famiglia", date: "02 Aprile 2026", imageUrl: "/italia.webp" },
  { id: "4", title: "Litigi Societari: perché scegliere la Mediazione?", excerpt: "I vantaggi di risolvere le vertenze tra soci d'azienda senza ricorrere al tribunale: risparmio di tempo e tutela della privacy aziendale.", content: "", category: "Diritto Commerciale", date: "25 Marzo 2026", imageUrl: "/italia.webp" },
  { id: "5", title: "Aggiornamento Tariffe 2026 per la Mediazione Obbligatoria", excerpt: "Pubblicate le nuove tabelle indennitarie approvate dal Ministero della Giustizia. Ecco cosa cambia per privati e aziende.", content: "", category: "Aggiornamenti Studio", date: "18 Marzo 2026", imageUrl: "/italia.webp" },
  { id: "6", title: "Mediazione telematica: come funziona", excerpt: "Una guida completa alle sessioni di mediazione online tramite piattaforme certificate.", content: "", category: "Aggiornamenti Studio", date: "10 Marzo 2026", imageUrl: "/italia.webp" },
  { id: "7", title: "La validità del verbale di accordo", excerpt: "Capire il valore legale e di titolo esecutivo dell'accordo raggiunto in mediazione.", content: "", category: "Mediazione Civile", date: "05 Marzo 2026", imageUrl: "/italia.webp" },
  { id: "8", title: "Condominio e liti: la mediazione obbligatoria", excerpt: "Focus sulle materie condominiali soggette a obbligo preventivo di mediazione. Le scadenze importanti.", content: "", category: "Diritto Civile", date: "28 Febbraio 2026", imageUrl: "/italia.webp" },
  { id: "9", title: "Mediazione successoria: le quote ereditari", excerpt: "Come dividere l'asse ereditario in pace evitando cause lunghe dieci anni.", content: "", category: "Diritto di Famiglia", date: "20 Febbraio 2026", imageUrl: "/italia.webp" },
  { id: "10", title: "Incontro Formativo I.Me.Con 2026", excerpt: "Si è concluso con successo il nostro webinar sulle tecniche di negoziazione integrativa. Guarda il riassunto.", content: "", category: "Aggiornamenti Studio", date: "15 Febbraio 2026", imageUrl: "/italia.webp" },
  { id: "11", title: "Tutela dei Consumatori", excerpt: "Nuovi strumenti di risoluzione per le controversie tra cittadini e grandi operatori di telefonia ed energia.", content: "", category: "Diritto Civile", date: "05 Febbraio 2026", imageUrl: "/italia.webp" },
  { id: "12", title: "Locazioni e Sfratti", excerpt: "La mediazione come strumento per ridefinire i canoni di affitto commerciale.", content: "", category: "Diritto Commerciale", date: "28 Gennaio 2026", imageUrl: "/italia.webp" },
  { id: "13", title: "Danni Medici: conciliare senza andare in aula", excerpt: "Malasanità: perché le assicurazioni preferiscono risolvere la controversia in mediazione.", content: "", category: "Mediazione Civile", date: "15 Gennaio 2026", imageUrl: "/italia.webp" },
  { id: "14", title: "Nuovi uffici aperti al pubblico", excerpt: "La sede I.Me.Con raddoppia i propri spazi per accogliere più procedimenti in parallelo garantendo privacy assoluta.", content: "", category: "Aggiornamenti Studio", date: "10 Gennaio 2026", imageUrl: "/italia.webp" }
];
