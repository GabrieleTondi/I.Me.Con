"use client";

import { motion } from 'framer-motion';

export const LocationHero = () => {
  return (
    /* COLORE SFONDO SEZIONE: bg-brand-primary regala il fondo blu scuro formale. FORMA: min-h-[40vh] la rende una striscia compatta e decisa. */
    <section className="relative min-h-[40vh] flex items-center pt-32 pb-16 px-6 md:px-12 bg-brand-primary overflow-hidden">
      
      {/* EFFETTO VISIVO BLOB LUCE: Opacità bassissima per non infastidire la lettura testuale ma dare profondità all'header. */}
      <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-brand-secondary opacity-20 blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full text-center space-y-4">
        {/* TRANSIZIONE TITOLO: Salita morbida e Opacità molto breve (y: 20-> 0) */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          /* FONT E COLORE TITOLO: font-chillax text-contrast per impatto monumentale sul Blu. */
          className="text-5xl md:text-7xl font-bold font-chillax text-contrast leading-tight"
        >
          {/* COLORE TESTO RISALTO: Viene applicato brand-accent (Arancione) sulla parola chiave "Sede" o "Siamo" */}
          Dove <span className="text-brand-accent">Siamo</span>
        </motion.h1>
        
        {/* TRANSIZIONE PARAGRAFO SOTTOTITOLO: Arriva un pelo dopo il titolo (delay: 0.1) */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          /* COLORE E FORMA PARAGRAFO: max-w-2xl accorcia le righe rendendo il paragrafo impilato da rivista. text-contrast/90 è bianco soft. */
          className="text-lg md:text-xl text-contrast/90 font-light leading-relaxed max-w-2xl mx-auto"
        >
          Vieni a trovarci nei nostri uffici. Strutture adeguate e riservate, dedicate all'ascolto e alla risoluzione pacifica dei conflitti.
        </motion.p>
      </div>
    </section>
  );
};
