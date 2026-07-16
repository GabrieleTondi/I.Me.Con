"use client";

import { motion } from 'framer-motion';
import { Users, Briefcase, Award } from 'lucide-react';

export const Stats = () => {
  const stats = [
    {
      id: 1,
      icon: <Award size={40} />, // ICONA: Modifica questo tag (es: <Globe />) per cambiare l'icona
      title: "20 Anni", // TESTO PRIMARIO
      subtitle: "di attività", // TESTO SECONDARIO
      description: "Operiamo con eccellenza dal 2004." // DESCRIZIONE
    },
    {
      id: 2,
      icon: <Briefcase size={40} />,
      title: "100+",
      subtitle: "Mediazioni annue",
      description: "Gestiamo centinaia di casi con successo."
    },
    {
      id: 3,
      icon: <Users size={40} />,
      title: "15 Persone",
      subtitle: "al tuo servizio",
      description: "Un team di professionisti altamente qualificati."
    }
  ];

  /* TRANSIZIONE: Ritardo progressivo delle card (0.2 secondi l'una dall'altra) */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  /* TRANSIZIONE: Lo spostamento in basso (y: 50 -> 0) e opacità di ogni singola CARD */
  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    /* COLORE SFONDO SEZIONE: 'bg-brand-neutral' (#F8FAFC) */
    <section className="bg-brand-neutral py-24 px-6 md:px-12 relative z-10 border-y border-brand-border">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {stats.map((stat) => (
            <motion.div 
              key={stat.id}
              variants={itemVariants}
              className="bg-brand-primary p-8 md:p-10 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:border-brand-accent/60 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="bg-white/10 w-18 h-18 rounded-2xl flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {stat.icon}
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-chillax font-bold text-contrast mb-2 tracking-tight">{stat.title}</h2>
                <h3 className="text-lg sm:text-xl text-brand-accent font-sans font-semibold mb-3">{stat.subtitle}</h3>
                <p className="text-contrast/80 leading-relaxed font-sans font-light text-base">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
