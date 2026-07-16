"use client";

import { motion } from 'framer-motion';

export const NewsHero = () => {
  return (
    /* COLORE SFONDO SEZIONE: bg-brand-primary */
    <section className="relative min-h-[50vh] flex items-center pt-32 pb-20 px-6 md:px-12 bg-brand-primary overflow-hidden border-b border-white/10">
      
      {/* EFFETTO VISIVO BLOB LUCE */}
      <div className="absolute top-0 right-0 w-[40%] h-[100%] rounded-full bg-brand-third opacity-15 blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full text-center space-y-5">
        {/* TRANSIZIONE TITOLO */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold font-chillax text-contrast leading-tight tracking-tight"
        >
          News <span className="text-brand-accent">Rilevanti</span>
        </motion.h1>
        
        {/* TRANSIZIONE PARAGRAFO SOTTOTITOLO */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg sm:text-xl text-contrast/85 font-sans font-light leading-relaxed max-w-2xl mx-auto"
        >
          Rimani aggiornato sulle ultime novità normative, sentenze chiave e approfondimenti nel mondo della mediazione civile e commerciale.
        </motion.p>
      </div>
    </section>
  );
};
