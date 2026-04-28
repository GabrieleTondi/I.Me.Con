"use client";

import { motion } from 'framer-motion';

export const Mission = () => {
  return (
    /* COLORE SFONDO SEZIONE: bg-brand-neutral lo stende con un grigio chiarissimo/azzurro neutro (#EBF2FA) */
    <section className="bg-brand-neutral py-24 px-6 md:px-12 relative">
      {/* FORMA E GRIGLIA: Aggiunta grid-cols-1 su mobile, e due colonne precise divise a metà lg:grid-cols-2 su layout Desktop */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* TRANSIZIONE SCORRIMENTO (TESTI A SINISTRA): Entra elegantemente da sinistra a destra (x: -30 -> x: 0) non appena passi col mouse */}
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8 }}
           className="space-y-6"
        >
          {/* FONT E COLORE H2: text-brand-primary colora "La Nostra" ed il custom font font-chillax dona linearità rigorosa */}
          <h2 className="text-4xl md:text-5xl font-chillax text-brand-primary">La Nostra <span className="text-brand-accent">Missione</span></h2>
          
          {/* FORMA (Linea divisoria): Un piccolo rigo decorativo sotto il titolo bg-brand-accent per richiamarlo (Largo w-20, alto h-1) */}
          <div className="w-20 h-1 bg-brand-accent rounded-full" />
          
          <div className="space-y-4 text-brand-primary/80 leading-relaxed font-light text-lg pt-4">
             <p>
               Dal 2004, lo Studio <strong>I.Me.Con</strong> (Iniziative di Mediazione e Conciliazione) opera come Organismo di Mediazione Civile e Commerciale, accompagnando professionisti, aziende e privati in un percorso di risoluzione alternativa delle controversie.
             </p>
             <p>
               La nostra filosofia si fonda sull'ascolto attivo e sull'imparzialità. Crediamo fermamente che il conflitto non debba necessariamente sfociare in una logorante battaglia legale, ma possa trasformarsi in un'opportunità di confronto costruttivo.
             </p>
             <p>
               Le parti coinvolte vengono guidate da mediatori altamente qualificati verso accordi vincolanti e personalizzati, superando le rigidità del sistema giudiziario tradizionale con tempi celeri e costi trasparenti.
             </p>
          </div>
        </motion.div>

        {/* TRANSIZIONE SCORRIMENTO (IMMAGINE A DESTRA): Entra elegantemente da destra (x: 30) a sinistra quando fai lo scroll col mouse */}
        <motion.div
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, delay: 0.2 }}
           /* FORMA E OMBRE IMMAGINE: aspect-[4/5] rettangolo verticale rigetto, arrotondamento smussato (rounded-2xl) ed ombra profonda (shadow-2xl) */
           className="relative aspect-[4/5] w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-brand-primary group"
        >
           {/* TRANSIZIONE COLORE FOTO HOVER: grayscale mantiene la foto in B&W, al passaggio del mouse diviene group-hover:grayscale-0 colorizzandola in 0.7 secondi */}
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577413155700-1c39bc020fde?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-80 grayscale mix-blend-overlay group-hover:grayscale-0 group-hover:mix-blend-normal transition-all duration-700" />
           
           {/* COLORE GRADIENTE INFERIORE: Si scurisce il fondo in blu intenso dalla base al centro (from-brand-primary/95 a trasparnency) */}
           <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/95 via-brand-primary/30 to-transparent pointer-events-none" />
           
           <div className="absolute bottom-8 left-8 right-8 text-contrast">
              <h3 className="font-chillax text-2xl mb-1">Passione & Imparzialità</h3>
              <p className="text-sm text-brand-accent uppercase tracking-widest font-semibold">I.Me.Con</p>
           </div>
        </motion.div>
        
      </div>
    </section>
  );
};
