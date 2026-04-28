"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { MOCK_NEWS } from '@/lib/mockData';

// LOGICA E DATI: Categorie usate all'interno del Menù a Tendina dei Filtri
const CATEGORIES = ["Tutte", "Mediazione Civile", "Diritto Commerciale", "Diritto di Famiglia", "Diritto Civile", "Riforma Cartabia", "Aggiornamenti Studio"];

export const NewsContainer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutte");
  const [currentPage, setCurrentPage] = useState(1);

  // LOGICA (FILTRO): Filtra le notizie se cambia il testo o la categoria scelta
  const filteredNews = useMemo(() => {
    let results = MOCK_NEWS;
    if (selectedCategory !== "Tutte") {
       results = results.filter(news => news.category === selectedCategory);
    }
    if (searchQuery.trim() !== "") {
       const q = searchQuery.toLowerCase();
       results = results.filter(news => 
         news.title.toLowerCase().includes(q) || 
         news.excerpt.toLowerCase().includes(q)
       );
    }
    return results;
  }, [searchQuery, selectedCategory]);

  const featuredNews = filteredNews.length > 0 ? filteredNews[0] : null; // Il primo in alto (In risalto)
  const remainingNews = filteredNews.slice(1); // Le rimanenti in basso 
  
  // LOGICA (PAGINAZIONE): Gestione Pagine per il limite. Mostriamo Max 9 grid news (+1 risalto) per ogni pagina!
  const itemsPerPage = 9;
  const totalPages = Math.ceil(remainingNews.length / itemsPerPage);
  const paginatedNews = remainingNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    /* COLORE SFONDO SEZIONE GLOBALE: Questo colore neutro 'bg-brand-neutral' si attacca perfettamente sotto la Hero Blu Scura */
    <section className="bg-brand-neutral py-16 px-6 md:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* === AREA BARRA DI RICERCA E FILTRI TENDINA === */}
        {/* FORMA E COLORE BARRA: sfondo 'bg-white', ombra elevata shadow-lg e border sottile.  */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 z-20 relative">
          
          <div className="flex-1 relative">
            {/* ICONA DI RICERCA (Search Lens) */}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-third" size={20} />
            <input 
              type="text" 
              placeholder="Cerca tra le notizie per parola chiave (es. Tribunale, Fallimento)..." 
              /* INTERAZIONI E COLORI INPUT BAR: 'focus:border-brand-third/30' cambia il bordo della input quando la clicchi. Lo sfondo base di digitazione è 'bg-brand-neutral'*/
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-brand-neutral/50 border border-transparent outline-none focus:border-brand-third/30 focus:ring-1 focus:ring-brand-third/30 transition-all text-brand-primary placeholder:text-brand-primary/40 font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="md:w-72 relative">
            <select 
              /* INTERAZIONI E COLORI SELECT BAR (Menù a Tendina): Usa la stessa struttura grafica dell'Input Bar da affiancare coerentemente. */
              className="w-full px-4 py-3 rounded-lg bg-brand-neutral/50 border border-transparent outline-none focus:border-brand-third/30 focus:ring-1 focus:ring-brand-third/30 text-brand-primary cursor-pointer appearance-none font-medium"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {/* Freccina giu customizzata a mano - 'text-brand-third' per accoppiarla all'Azzurro Primario */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-third">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* TRANSIZIONE (AnimatePresence): Garantisce sfumature perfette di comparsa/scomparsa in reazione ai filtri cliccati. FENOMENALE! */}
        <AnimatePresence mode="wait">
          <div key={`${searchQuery}-${selectedCategory}-${currentPage}`} className="space-y-12">
            
            {/* === SEZIONE NOTIZIA IN RISALTO (Prima Notizia Trovata) === */}
            {featuredNews && (
              <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                /* FORMA E EFFETTI CARTOLINA RISALTO: Grandissime dimensioni con grid-cols-2. Forte "hover:shadow-2xl" per simulare alzata fisica dalla pagina col mouse.*/
                className="group relative grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 overflow-hidden transition-all"
              >
                 <div className="relative aspect-video md:aspect-auto md:min-h-[350px] w-full rounded-2xl overflow-hidden border border-gray-100">
                    {/* IMMAGINE RISALTO: 'group-hover:scale-105' zoomerà l'immagine lentamente col mouse. */}
                    <Image src={featuredNews.imageUrl} alt={featuredNews.title} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* ETICHETTA COLORATA DA RISALTO: bg-brand-accent per etichetta Arancio Fluo "In Risalto" appiccicata alla foto in top-4 left-4 */}
                    <div className="absolute top-4 left-4 bg-brand-accent text-contrast text-xs tracking-widest uppercase font-semibold px-4 py-1.5 rounded-full shadow-lg">
                      In Risalto • {featuredNews.category}
                    </div>
                 </div>
                 <div className="flex flex-col justify-center space-y-4 py-4 md:py-8 pr-4">
                    <span className="text-brand-third font-medium text-sm">{featuredNews.date}</span>
                    <h2 className="text-3xl md:text-5xl font-chillax text-brand-primary leading-tight group-hover:text-brand-accent transition-colors">
                      {featuredNews.title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed pt-2">
                      {featuredNews.excerpt}
                    </p>
                    <div className="pt-4">
                      {/* EFFETTI TITOLO LINK TESTUALE IN BASSO DESTRA: Cliccando su "leggi articolo" passa l'orange 'hover:text-brand-accent' e si sottolinea. */}
                      <a href="#" className="font-medium text-brand-primary hover:text-brand-accent flex items-center gap-2 hover:underline underline-offset-4 w-max">
                        Leggi Articolo Completo <ChevronRight size={18} />
                      </a>
                    </div>
                 </div>
              </motion.article>
            )}

            {/* === SEZIONE GRIGLIA NOTIZIE MINORI === */}
            {paginatedNews.length > 0 ? (
              /* FORMA GRIGLIA MINORE: grid-cols-3 significa visualizzazione "A Scacchiera per Tre". */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedNews.map((news, i) => (
                  <motion.article 
                    key={news.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    /* FORMA CARTOLINE MINORI: 'rounded-2xl' bordi arrotondati e ombra 'shadow-lg' normale su sfondo bianco bg-white */
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden flex flex-col transition-all"
                  >
                     <div className="relative h-56 w-full overflow-hidden border-b border-gray-50">
                        {/* IMMAGINE MINORE: Transizione del hover scala zoom immagine del contenitore padre! */}
                        <Image src={news.imageUrl} alt={news.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        
                        {/* ETICHETTA CATEGORIA BIANCA TRASPARENTISSIMA: Usa un effeto vetro 'backdrop-blur-sm' per galleggiare sulla foto a Dx! */}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-brand-primary font-bold text-[10px] tracking-wide uppercase px-3 py-1.5 rounded-full shadow-sm">
                          {news.category}
                        </div>
                     </div>
                     <div className="flex-1 p-6 flex flex-col space-y-3">
                        <span className="text-brand-third font-medium text-xs">{news.date}</span>
                        <h3 className="text-xl font-chillax text-brand-primary group-hover:text-brand-accent transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                        {/* LINE CLAMP: line-clamp-3 limita l'abstract a massimo 3 righe evitando schede alte in modo differente l'una dall'altra!! */}
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1">
                          {news.excerpt}
                        </p>
                        <a href="#" className="inline-block mt-auto text-brand-accent font-medium text-sm pt-4 hover:underline underline-offset-4 w-max">
                          Leggi di più &rarr;
                        </a>
                     </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              !featuredNews && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="py-20 text-center space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm"
                >
                  <h3 className="text-3xl font-chillax text-brand-primary">Nessuna notizia trovata</h3>
                  <p className="text-gray-500 font-light text-lg">Prova a cambiare i parametri di ricerca o il filtro categoria.</p>
                </motion.div>
              )
            )}
          </div>
        </AnimatePresence>

        {/* === COMPONENTE ESTERNO DI PAGINAZIONE GOOGLE STYLE === */}
        {totalPages > 1 && (
          /* FORMA LAYOUT PAGINAZIONE: E' centrato nello schermo. */
          <div className="pt-12 flex justify-center items-center gap-2">
             
             {/* TRANSIZIONE COLORI FRECCINA PRECEDENTE */}
             <button 
               disabled={currentPage === 1}
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               className="p-2 rounded-full border border-gray-200 text-brand-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               <ChevronLeft size={20} />
             </button>
             
             {/* TRANSIZIONE COLORI E FORME BOTTONCINI NUMBERATI */}
             {Array.from({ length: totalPages }).map((_, idx) => {
               const p = idx + 1;
               return (
                 <button
                   key={p}
                   onClick={() => setCurrentPage(p)}
                   className={`w-10 h-10 rounded-full font-medium transition-colors ${
                     /* ATTENZIONE: Se stiamo visitando questa pagina il pallino diventa colore "Arancio-Accent", se non è la pagina corrente rimane grigio ma prende l'effetto hover. */
                     currentPage === p 
                       ? "bg-brand-accent text-white shadow-md cursor-default border border-brand-accent" 
                       : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-brand-primary"
                   }`}
                 >
                   {p}
                 </button>
               );
             })}
             
             {/* TRANSIZIONE COLORI FRECCINA SUCCESSIVA */}
             <button 
               disabled={currentPage === totalPages}
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               className="p-2 rounded-full border border-gray-200 text-brand-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        )}
        
      </div>
    </section>
  );
};
