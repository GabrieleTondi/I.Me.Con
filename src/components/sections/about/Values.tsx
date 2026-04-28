"use client";

import { motion } from 'framer-motion';
import { ShieldCheck, Scale, Handshake } from 'lucide-react';

export const Values = () => {
  const values = [
    {
      id: 1,
      icon: <ShieldCheck size={40} />, // ICONA: Modificabile tramite libreria lucide-react
      title: "Riservatezza",
      description: "Ogni frammento di informazione condivisa durante i nostri incontri è strettamente confidenziale."
    },
    {
      id: 2,
      icon: <Scale size={40} />,
      title: "Imparzialità",
      description: "Il mediatore non giudica, ma agevola un equilibrio neutrale affinché tutti si sentano protagonisti."
    },
    {
      id: 3,
      icon: <Handshake size={40} />,
      title: "Risultato",
      description: "L’obiettivo finale è redigere un accordo concreto, fattibile e con valore esecutivo legale."
    }
  ];

  /* TRANSIZIONE: StaggerChildren propaga l'animazione dal primo elemento di card fino all'ultimo in differita */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    /* COLORE SFONDO SEZIONE: bg-brand-bg dipinge quaeto layout di Blu Reale (Diverso dal neutro precedente in Mission) */
    <section className="bg-brand-bg py-24 px-6 md:px-12 relative overflow-hidden">
      
      {/* EFFETTO VISIVO BLOB LUCE: Opacità al 30% a destra arrotondato blur per movimento visivo. Puoi toglierlo disabilitando questo div. */}
      <div className="absolute top-0 right-0 w-[40%] h-[100%] rounded-full bg-brand-secondary opacity-30 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
           {/* FONT E COLORE H2: font-chillax associato ad un colore di testo in contrasto chiaro contro la sez. scura. */}
           <h2 className="text-4xl md:text-5xl font-chillax text-contrast">I Nostri <span className="text-brand-accent">Valori</span></h2>
           <p className="text-contrast/80 max-w-2xl mx-auto font-light text-lg">Punti focali del nostro modus operandi, garantiti ad ogni singolo cliente.</p>
        </div>

        <motion.div 
          /* FORMA GRIGLIA CARDS: Divisa in tre esatte colonne. */
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {values.map((val) => (
            <motion.div 
              key={val.id}
              variants={itemVariants}
              /* COLORE SFONDO CARD: Le card si dipingono in 'bg-brand-primary' (Blu ancor più scuro). Presenti pure 'hover:border-brand-accent' che svela una cornice arancione al passaggio della freccetta!! */
              className="bg-brand-primary p-8 rounded-2xl border border-white/5 shadow-2xl hover:border-brand-accent transition-colors group"
            >
              <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform">
                {val.icon}
              </div>
              <h3 className="text-3xl font-chillax text-contrast mb-4">{val.title}</h3>
              <p className="text-contrast/80 leading-relaxed font-light">
                {val.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
