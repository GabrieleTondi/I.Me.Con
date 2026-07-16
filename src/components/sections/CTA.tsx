"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const CTA = () => {
  return (
    /* COLORE SFONDO SEZIONE: 'bg-brand-primary' utilizza la variante scura (#064789). */
    <section className="bg-brand-primary py-32 px-6 md:px-12 relative overflow-hidden">
      
      {/* EFFETTO VISIVO (BLOB LUMINOSO): Questo div aggiunge una scia luminosa tonda sfuocata (blur-[100px]) sullo sfondo. Modifica opacity-20 per renderlo più o meno visibile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-primary opacity-20 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        {/* TRANSIZIONE TITOLO: Entra dal basso di 20px all'inizio (opacity: 0, y: 20) */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} /* Si attiva non appena visibile a schermo */
          viewport={{ once: true }} /* Viene eseguita una sola volta */
          /* FORMA E FONT: text-5xl o text-7xl in base allo schermo, font-chillax e text-contrast (Bianco) */
          className="text-5xl md:text-7xl font-chillax text-contrast tracking-wide"
        >
          Iniziamo la Mediazione?
        </motion.h2>
        
        {/* TRANSIZIONE TESTO: Ha un 'delay: 0.1' per apparire 0.1 secondi dopo il titolo! */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          /* COLORE: text-contrast/90 (Bianco opaco) */
          className="text-xl text-contrast/90 max-w-2xl mx-auto font-light"
        >
          Compila il modulo o contattaci per avviare subito la tua pratica.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }} // Appare per ultimo
           /* FORMA: flex-col su mobile (bottoni impilati), flex-row su schermi grandi (bottoni affiancati) */
           className="pt-8 flex flex-col sm:flex-row justify-center gap-6"
        >
           {/* PULSANTE ARANCIONE: variant='primary'. L'ombra è estesa con 'shadow-2xl' */}
           <Link href="/contatti?tab=mediazione">
             <Button variant="primary" className="text-xl px-12 py-5 shadow-2xl w-full sm:w-auto">
               Compila il Form
             </Button>
           </Link>
           {/* PULSANTE BIANCO: variant='white' */}
           <Link href="/contatti?tab=generale">
             <Button variant="white" className="text-xl px-12 py-5 shadow-xl w-full sm:w-auto">
               Contattaci
             </Button>
           </Link>
        </motion.div>
      </div>
    </section>
  );
};
