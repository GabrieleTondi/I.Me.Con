"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const CTA = () => {
  return (
    /* COLORE SFONDO SEZIONE: 'bg-brand-primary' (#1E40AF - Deep Royal Blue) */
    <section className="bg-brand-primary py-28 px-6 md:px-12 relative overflow-hidden border-t border-white/10">
      
      {/* EFFETTO VISIVO (BLOB LUMINOSO): Bagliore morbido sullo sfondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-brand-third opacity-15 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        {/* TRANSIZIONE TITOLO */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-chillax font-bold text-contrast tracking-tight leading-tight"
        >
          Iniziamo il Procedimento di <span className="text-brand-accent">Mediazione</span>?
        </motion.h2>
        
        {/* TRANSIZIONE TESTO */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-xl text-contrast/85 max-w-2xl mx-auto font-sans font-light leading-relaxed"
        >
          Compila il modulo online con guidata guidata multi-step o contatta la nostra segreteria per avviare subito la tua pratica con garanzia istituzionale.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
           className="pt-6 flex flex-col sm:flex-row justify-center gap-5"
        >
           {/* PULSANTE ARANCIONE */}
           <Link href="/contatti?tab=mediazione" className="w-full sm:w-auto">
             <Button variant="primary" className="text-base sm:text-lg px-10 py-4 shadow-xl w-full">
               Compila il Wizard di Mediazione
             </Button>
           </Link>
           {/* PULSANTE BIANCO */}
           <Link href="/contatti?tab=generale" className="w-full sm:w-auto">
             <Button variant="white" className="text-base sm:text-lg px-10 py-4 shadow-lg w-full">
               Contatta Segreteria
             </Button>
           </Link>
        </motion.div>
      </div>
    </section>
  );
};
