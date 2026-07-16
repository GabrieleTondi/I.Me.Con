"use client";

import { motion } from 'framer-motion';

export const Mission = () => {
  return (
    /* COLORE SFONDO SEZIONE: bg-brand-neutral (#F8FAFC) */
    <section className="bg-brand-neutral py-24 px-6 md:px-12 relative border-b border-brand-border font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* TRANSIZIONE SCORRIMENTO (TESTI A SINISTRA) */}
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8 }}
           className="space-y-6"
        >
           <h2 className="text-3xl sm:text-4xl md:text-5xl font-chillax font-semibold text-brand-dark leading-tight">
             La Nostra <span className="text-brand-accent">Missione</span>
           </h2>
           
           <div className="w-20 h-1.5 bg-brand-accent rounded-full" />
           
           <div className="space-y-4 text-brand-muted leading-relaxed font-sans font-normal text-base sm:text-lg pt-3">
              <p>
                Dal 2004, lo Studio <strong>I.Me.Con</strong> (Iniziative di Mediazione e Conciliazione) opera come Organismo di Mediazione Civile e Commerciale, accompagnando professionisti, aziende e privati in un percorso di risoluzione alternativa delle controversie.
              </p>
              <p>
                La nostra filosofia si fonda sull&apos;ascolto attivo e sull&apos;imparzialità. Crediamo fermamente che il conflitto non debba necessariamente sfociare in una logorante battaglia legale, ma possa trasformarsi in un&apos;opportunità di confronto costruttivo.
              </p>
              <p>
                Le parti coinvolte vengono guidate da mediatori altamente qualificati verso accordi vincolanti e personalizzati, superando le rigidità del sistema giudiziario tradizionale con tempi celeri e costi trasparenti.
              </p>
           </div>
        </motion.div>

        {/* TRANSIZIONE SCORRIMENTO (IMMAGINE A DESTRA) */}
        <motion.div
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="relative aspect-[4/5] w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-brand-primary group"
        >
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577413155700-1c39bc020fde?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-85 grayscale mix-blend-overlay group-hover:grayscale-0 group-hover:mix-blend-normal transition-all duration-700" />
           
           <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/95 via-brand-primary/40 to-transparent pointer-events-none" />
           
           <div className="absolute bottom-8 left-8 right-8 text-contrast space-y-1">
              <h3 className="font-chillax font-semibold text-2xl">Passione & Imparzialità</h3>
              <p className="text-xs text-brand-accent uppercase tracking-widest font-bold">I.Me.Con • ADR Institute</p>
           </div>
        </motion.div>
        
      </div>
    </section>
  );
};
