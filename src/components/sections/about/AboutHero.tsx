"use client";

import { motion } from 'framer-motion';

export const AboutHero = () => {
  return (
    /* COLORE SFONDO SEZIONE: 'bg-brand-primary' (#082F49) */
    <section className="relative min-h-[55vh] flex items-center pt-32 pb-20 px-6 md:px-12 bg-brand-primary overflow-hidden border-b border-white/10">
      {/* EFFETTO VISIVO (BLOB LUMINOSO) */}
      <div className="absolute top-0 right-0 w-[60%] h-[100%] rounded-full bg-brand-third opacity-15 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
        
        {/* TRANSIZIONE TITOLO H1 */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold font-chillax text-contrast leading-tight tracking-tight"
        >
          Chi <span className="text-brand-accent">Siamo</span>
        </motion.h1>
        
        {/* TRANSIZIONE PARAGRAFO */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-contrast/85 font-sans font-light leading-relaxed max-w-2xl mx-auto"
        >
          Da oltre vent&apos;anni operiamo nel settore della mediazione con un&apos;unica grande missione: facilitare il dialogo, sciogliere i nodi e raggiungere accordi duraturi e reciprocamente vantaggiosi.
        </motion.p>
      </div>
    </section>
  );
};
