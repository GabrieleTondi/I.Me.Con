"use client";

import { motion } from 'framer-motion';

export const NewsHero = () => {
  return (
    /* COLORE SFONDO SEZIONE: bg-brand-primary regala il fondo blu scuro classico. FORMA: L'altezza è impostata come min-h-[40vh] (Più stretta e orizzontale rispetto a "Chi Siamo") */
    <section className="relative min-h-[40vh] flex items-center pt-32 pb-16 px-6 md:px-12 bg-brand-primary overflow-hidden">
      
      {/* EFFETTO VISIVO BLOB LUCE: In questo caso il bagliore è "bg-brand-accent" dando sfumature calde-arancio in alto a destra. */}
      <div className="absolute top-0 right-0 w-[40%] h-[100%] rounded-full bg-brand-accent opacity-20 blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full text-center space-y-4">
        {/* TRANSIZIONE TITOLO: Caduta e Opacità molto breve (y: 20-> 0) */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          /* FONT E COLORE TITOLO: font-chillax text-contrast per leggere bene il titolo sopra lo sfondo scuro */
          className="text-5xl md:text-7xl font-bold font-chillax text-contrast leading-tight"
        >
          {/* COLORE TESTO RISALTO: Viene applicato brand-accent (Arancio) sulla parola chiave "Rilevanti" */}
          News <span className="text-brand-accent">Rilevanti</span>
        </motion.h1>
        
        {/* TRANSIZIONE PARAGRAFO SOTTOTITOLO: Parte in ritardo con delay di 0.1 per dare enfasi dinamica */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          /* COLORE E FORMA PARAGRAFO: text-contrast ammorbidito del 90%. Max width molto contenuta per centralizzare il testo. */
          className="text-lg md:text-xl text-contrast/90 font-light leading-relaxed max-w-2xl mx-auto"
        >
          Rimani aggiornato sulle ultime novità normative, sentenze chiave e approfondimenti nel mondo della mediazione.
        </motion.p>
      </div>
    </section>
  );
};
