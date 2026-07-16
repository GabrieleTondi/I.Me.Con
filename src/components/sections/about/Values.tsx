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
    /* COLORE SFONDO SEZIONE: bg-brand-primary */
    <section className="bg-brand-primary py-24 px-6 md:px-12 relative overflow-hidden font-sans">
      
      {/* EFFETTO VISIVO BLOB LUCE */}
      <div className="absolute top-0 right-0 w-[40%] h-[100%] rounded-full bg-brand-third opacity-15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
           <h2 className="text-3xl sm:text-4xl md:text-5xl font-chillax font-semibold text-contrast tracking-tight">
             I Nostri <span className="text-brand-accent">Valori</span>
           </h2>
           <p className="text-contrast/80 max-w-2xl mx-auto font-light text-lg">Punti focali del nostro modus operandi, garantiti ad ogni singolo cliente.</p>
        </div>

        <motion.div 
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
              className="bg-brand-primary/90 p-8 md:p-10 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:border-brand-accent/60 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="bg-white/10 w-18 h-18 rounded-2xl flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {val.icon}
                </div>
                <h3 className="text-2xl sm:text-3xl font-chillax font-semibold text-contrast mb-3">{val.title}</h3>
                <p className="text-contrast/80 leading-relaxed font-sans font-light text-base">
                  {val.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
