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
    /* COLORE SFONDO SEZIONE GLOBALE: 'bg-brand-neutral' (#F8FAFC) */
    <section className="bg-brand-neutral py-16 px-6 md:px-12 min-h-screen font-sans border-b border-brand-border">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* === AREA BARRA DI RICERCA E FILTRI TENDINA === */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-md border border-brand-border z-20 relative">
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/60" size={20} />
            <input 
              type="text" 
              placeholder="Cerca tra le notizie per parola chiave (es. Tribunale, Mediazione)..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-brand-neutral/60 border border-transparent outline-none focus:border-brand-primary/30 focus:ring-1 focus:ring-brand-primary/30 transition-all text-brand-dark placeholder:text-brand-muted/60 font-medium text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="md:w-72 relative">
            <select 
              className="w-full px-4 py-3 rounded-xl bg-brand-neutral/60 border border-transparent outline-none focus:border-brand-primary/30 focus:ring-1 focus:ring-brand-primary/30 text-brand-dark cursor-pointer appearance-none font-medium text-sm sm:text-base"
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary/70">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* TRANSIZIONE (AnimatePresence) */}
        <AnimatePresence mode="wait">
          <div key={`${searchQuery}-${selectedCategory}-${currentPage}`} className="space-y-12">
            
            {/* === SEZIONE NOTIZIA IN RISALTO === */}
            {featuredNews && (
              <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="group relative grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl shadow-lg hover:shadow-2xl border border-brand-border overflow-hidden transition-all duration-300"
              >
                 <div className="relative aspect-video md:aspect-auto md:min-h-[350px] w-full rounded-2xl overflow-hidden border border-brand-border/60">
                    <Image src={featuredNews.imageUrl} alt={featuredNews.title} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    <div className="absolute top-4 left-4 bg-brand-accent text-contrast text-xs tracking-widest uppercase font-semibold px-4 py-1.5 rounded-full shadow-lg">
                      In Risalto • {featuredNews.category}
                    </div>
                 </div>
                 <div className="flex flex-col justify-center space-y-4 py-4 md:py-8 pr-4">
                    <span className="text-brand-accent font-semibold text-sm tracking-wide">{featuredNews.date}</span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-chillax font-semibold text-brand-dark leading-tight group-hover:text-brand-accent transition-colors">
                      {featuredNews.title}
                    </h2>
                    <p className="text-brand-muted text-base sm:text-lg leading-relaxed font-sans font-normal pt-2">
                      {featuredNews.excerpt}
                    </p>
                    <div className="pt-4">
                      <a href="#" className="font-semibold text-brand-dark hover:text-brand-accent flex items-center gap-2 hover:underline underline-offset-4 w-max text-base transition-colors">
                        Leggi Articolo Completo <ChevronRight size={18} />
                      </a>
                    </div>
                 </div>
              </motion.article>
            )}

            {/* === SEZIONE GRIGLIA NOTIZIE MINORI === */}
            {paginatedNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedNews.map((news, i) => (
                  <motion.article 
                    key={news.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-brand-border overflow-hidden flex flex-col transition-all duration-300"
                  >
                     <div className="relative h-56 w-full overflow-hidden border-b border-brand-border/60">
                        <Image src={news.imageUrl} alt={news.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-brand-dark font-bold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full shadow-sm border border-brand-border/50">
                          {news.category}
                        </div>
                     </div>
                     <div className="flex-1 p-6 flex flex-col space-y-3">
                        <span className="text-brand-accent font-semibold text-xs tracking-wide">{news.date}</span>
                        <h3 className="text-xl font-chillax font-semibold text-brand-dark group-hover:text-brand-accent transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                        <p className="text-brand-muted text-sm leading-relaxed line-clamp-3 flex-1 font-sans font-normal">
                          {news.excerpt}
                        </p>
                        <a href="#" className="inline-block mt-auto text-brand-accent font-semibold text-sm pt-4 hover:underline underline-offset-4 w-max transition-colors">
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
                  className="py-20 text-center space-y-4 bg-white rounded-3xl border border-brand-border shadow-sm p-8"
                >
                  <h3 className="text-3xl font-chillax font-semibold text-brand-dark">Nessuna notizia trovata</h3>
                  <p className="text-brand-muted font-light text-lg">Prova a cambiare i parametri di ricerca o il filtro categoria.</p>
                </motion.div>
              )
            )}
          </div>
        </AnimatePresence>

        {/* === COMPONENTE DI PAGINAZIONE === */}
        {totalPages > 1 && (
          <div className="pt-12 flex justify-center items-center gap-2">
             
             <button 
               disabled={currentPage === 1}
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               className="p-2.5 rounded-full border border-brand-border text-brand-dark hover:bg-brand-neutral disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               <ChevronLeft size={20} />
             </button>
             
             {Array.from({ length: totalPages }).map((_, idx) => {
               const p = idx + 1;
               return (
                 <button
                   key={p}
                   onClick={() => setCurrentPage(p)}
                   className={`w-10 h-10 rounded-full font-medium transition-colors text-sm ${
                     currentPage === p 
                       ? "bg-brand-accent text-white shadow-md cursor-default border border-brand-accent font-semibold" 
                       : "bg-white text-brand-muted border border-brand-border hover:bg-brand-neutral hover:text-brand-dark"
                   }`}
                 >
                   {p}
                 </button>
               );
             })}
             
             <button 
               disabled={currentPage === totalPages}
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               className="p-2.5 rounded-full border border-brand-border text-brand-dark hover:bg-brand-neutral disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        )}
        
      </div>
    </section>
  );
};
