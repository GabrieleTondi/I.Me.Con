"use client";

import { motion } from 'framer-motion';

export const AboutHero = () => {
  return (
    /* COLORE SFONDO SEZIONE: 'bg-brand-primary' fa da schermo scuro globale (#064789). FORMA: 'min-h-[60vh]' blocca l'altezza leggermente più piccola di una Hero classica a pagina intera. */
    <section className="relative min-h-[60vh] flex items-center pt-32 px-6 md:px-12 bg-brand-primary overflow-hidden">
      {/* EFFETTO VISIVO (BLOB LUMINOSO): posiziona una nuvola di colore 'bg-brand-secondary' in alto a destra, sfumandola vistosamente (blur-[120px]) */}
      <div className="absolute top-0 right-0 w-[60%] h-[100%] rounded-full bg-brand-secondary opacity-30 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
        
        {/* TRANSIZIONE TITOLO H1: Il titolo cade dall'alto morbidamente in 0.6 secondi (y: 20 -> y:0) */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          /* FONT E COLORE: font-chillax text-contrast (bianco). text-5xl o text-7xl su desktop per dare gerarchia suprema */
          className="text-5xl md:text-7xl font-bold font-chillax text-contrast leading-tight"
        >
          {/* COLORE TESTO RISALTO: 'text-brand-accent' regala al target la colorazione arancione */}
          Chi <span className="text-brand-accent">Siamo</span>
        </motion.h1>
        
        {/* TRANSIZIONE PARAGRAFO: Appare 0.2s dopo per fare l'effetto a cascata dal titolo! */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          /* COLORE TESTO: Il /90 su text-contrast ammorbidisce il bianco sfumandolo un pochino all'interno della Hero */
          className="text-lg md:text-xl text-contrast/90 font-light leading-relaxed max-w-2xl mx-auto"
        >
          Da oltre vent'anni operiamo nel settore della mediazione con un'unica grande missione: facilitare il dialogo, sciogliere i nodi e raggiungere accordi duraturi e reciprocamente vantaggiosi.
        </motion.p>
      </div>
    </section>
  );
};
