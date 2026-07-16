"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';

export const Hero = () => {
  return (
    /* COLORE SFONDO: bg-brand-primary definisce lo sfondo di partenza (#082F49). */
    <section className="relative min-h-[95vh] flex items-center pt-28 pb-20 lg:pb-0 px-6 md:px-12 bg-brand-primary overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* TRANSIZIONE ENTRATA: Questo blocco entra dal basso (y: 20 -> y: 0) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* FORMA E COLORE "Badge" (Dal 2004) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-accent/40 bg-brand-accent/10 text-brand-accent text-xs sm:text-sm tracking-widest font-sans font-semibold uppercase mb-2 shadow-sm">
            Dal 2004 • Istituzione ADR
          </div>
          
          {/* COLORE E FONT H1: Display H1 monumentale in font-chillax ad alto contrasto */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-contrast font-chillax tracking-tight">
            Scegli la via <br/>
            della <span className="text-brand-accent underline decoration-brand-accent/40 underline-offset-8">Mediazione</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-contrast/85 max-w-lg font-sans font-light leading-relaxed">
            I.Me.Con supporta aziende, enti e privati nella risoluzione di controversie civili e commerciali, garantendo rapidità, riservatezza e accordi con valore di titolo esecutivo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-4 border-t border-white/10">
            {/* COMPONENTE: Riferimento al bottone Arancione (Variant Primary) */}
            <Link href="/contatti?tab=mediazione" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full px-8 py-4 text-base">
                Avvia Pratica
              </Button>
            </Link>
            {/* COMPONENTE: Riferimento al bottone Bianco (Variant White) */}
            <Link href="/contatti?tab=generale" className="w-full sm:w-auto">
              <Button variant="white" className="w-full px-8 py-4 text-base">
                Scarica Modulistica
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* CONTENITORE IMMAGINE SALENTO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative aspect-[4/5] w-full max-w-sm mx-auto bg-brand-neutral rounded-3xl overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl group"
        >
           {/* IMMAGINE STATICA E OTTIMIZZATA */}
           <Image src="/cartina salento.jpg" alt="Cartina Salento" fill sizes="(max-width: 768px) 100vw, 50vw" priority className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
           
           {/* COLORE TINTA UNITA (OVERLAY): Sfumatura dal Blu Principale al Trasparente */}
           <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/80 via-brand-primary/50 to-transparent pointer-events-none" />
           
           {/* STILE CIRCOLARE CENTRALE: Il cerchio "I.M.C" in mezzo alla mappa */}
           <div className="relative z-10 w-36 h-36 border-4 border-brand-accent/80 rounded-full flex items-center justify-center backdrop-blur-md bg-brand-primary/40 shadow-2xl">
              <span className="text-contrast font-chillax font-bold text-4xl tracking-wider">I.M.C</span>
           </div>
        </motion.div>
      </div>
    </section>
  );
};
