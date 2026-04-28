"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export const Hero = () => {
  return (
    /* COLORE SFONDO: bg-brand-primary definisce lo sfondo di partenza (#064789). */
    <section className="relative min-h-[95vh] flex items-center pt-20 pb-20 lg:pb-0 px-6 md:px-12 bg-brand-primary relative overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* TRANSIZIONE ENTRATA: Questo blocco entra dal basso (y: 20 -> y: 0) */ }
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* FORMA E COLORE "Badge" (Dal 2004) */}
          <div className="inline-block px-4 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 text-brand-accent text-sm tracking-widest font-medium uppercase mb-2">
            Dal 2004
          </div>
          
          {/* COLORE E FONT H1: text-contrast (Bianco), font-chillax (Il nuovo font) */}
          <h1 className="text-5xl font-bold md:text-7xl leading-tight text-contrast font-chillax">
            Scegli la via <br/>
            {/* COLORE TESTO: "Mediazione" colorato di arancione (text-brand-accent) */}
            della <span className="text-brand-accent">Mediazione</span>
          </h1>
          
          <p className="text-lg md:text-xl text-contrast/90 max-w-lg font-light leading-relaxed">
            I.Me.Con supporta aziende e privati nella risoluzione di controversie civili e commerciali, garantendo professionalità, riservatezza e accordi vincolanti.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-4 border-t border-gray-100/10">
            {/* COMPONENTE: Riferimento al bottone Arancione (Variant Primary) */}
            <Button variant="primary" className="w-full sm:w-auto px-8 py-4">
               Avvia Pratica
            </Button>
            {/* COMPONENTE: Riferimento al bottone Bianco (Variant White) */}
            <Button variant="white" className="w-full sm:w-auto px-8 py-4 text-brand-primary">
               Scarica Modulistica
            </Button>
          </div>
        </motion.div>

        {/* CONTENITORE IMMAGINE SALENTO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          // FORMA E PROPORZIONI: aspect-[4/5] garantisce un rettangolo verticale, max-w-sm lo rende leggermente più piccolo per non toccare la sezione successiva.
          className="relative aspect-[4/5] w-full max-w-sm mx-auto bg-brand-neutral rounded-2xl overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl"
        >
           {/* IMMAGINE STATICA E OTTIMIZZATA: Aggiunto attributo "sizes" per sbloccare le migliori performance Next.js */}
           <Image src="/cartina salento.jpg" alt="Cartina Salento" fill sizes="(max-width: 768px) 100vw, 50vw" priority className="object-cover opacity-90" />
           
           {/* COLORE TINTA UNITA (OVERLAY): Sfumatura dal Blu Principale al Trasparente miscelata sull'immagine */}
           <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/80 to-brand-primary/40 pointer-events-none" />
           
           {/* STILE CIRCOLARE CENTRALE: Il cerchio "I.M.C" in mezzo alla mappa */}
           <div className="relative z-10 w-32 h-32 border-4 border-brand-accent/80 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10">
              <span className="text-contrast font-chillax text-4xl">I.M.C</span>
           </div>
        </motion.div>
      </div>
    </section>
  );
};
