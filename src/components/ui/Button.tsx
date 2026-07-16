"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = 'primary', className = '', ...props }, ref) => {
  /* 
    FORMA E STRUTTURA: 
    - px-6 py-3.5: Spaziatura (Padding bilanciato per touch e click)
    - rounded-xl: Arrotondamento moderno dei bordi
    - text-sm sm:text-base font-semibold: Dimensione e spessore istituzionale
  */
  const baseClasses = "px-6 py-3.5 rounded-xl font-chillax font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-4 text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer select-none";
  
  /* 
    COLORI VARIANTI: 
    Allineate alla palette Royal & Slate istituzionale di I.Me.Con
  */
  const variants = {
    // Bottone Arancione Vibrante (Call-to-Action Primaria)
    primary: "bg-brand-accent text-contrast hover:bg-orange-600 focus:ring-brand-accent/40 shadow-lg hover:shadow-xl hover:shadow-brand-accent/20",
    
    // Bottone Slate Blue (Azione Secondaria)
    secondary: "bg-brand-secondary text-contrast hover:bg-brand-primary focus:ring-brand-secondary/40 shadow-md hover:shadow-lg",
    
    // Bottone con solo bordo per sfondi chiari o scuri
    outline: "border-2 border-brand-primary/40 text-brand-primary hover:bg-brand-primary hover:text-contrast focus:ring-brand-primary/20",
    
    // Bottone Bianco Puro (Ottimizzato per sezioni scure Hero/CTA)
    white: "bg-brand-surface text-brand-primary border border-white/20 hover:bg-brand-neutral focus:ring-white/30 shadow-lg hover:shadow-xl"
  };

  return (
    <motion.button
      ref={ref}
      // TRANSIZIONE: Animazione al passaggio del mouse (si alza di 2px (-2))
      whileHover={{ y: -2 }}
      // TRANSIZIONE: Animazione quando viene cliccato (torna in posizione)
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
