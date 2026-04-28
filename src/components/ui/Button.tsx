"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = 'primary', className = '', ...props }, ref) => {
  /* 
    FORMA E STRUTTURA: 
    - px-6 py-3: Spaziatura (Padding)
    - rounded-lg: Arrotondamento dei bordi
    - text-base font-medium: Dimensione e spessore del testo
  */
  const baseClasses = "px-6 py-3 rounded-lg font-chillax tracking-wide transition-all focus:outline-none focus:ring-4 text-base flex items-center justify-center gap-2 font-medium";
  
  /* 
    COLORI VARIANTI: 
    Modifica i "bg-..." e "text-..." qui sotto per alterare i colori dei bottoni
  */
  const variants = {
    // Bottone Arancione (Azione Primaria)
    primary: "bg-brand-accent text-contrast hover:opacity-90 focus:ring-brand-accent/50 shadow-md",
    
    // Bottone Blu Scuro
    secondary: "bg-brand-primary text-contrast hover:bg-brand-secondary focus:ring-brand-primary/50 shadow-md",
    
    // Bottone con solo bordo
    outline: "border border-brand-primary text-brand-primary hover:bg-brand-primary/5 focus:ring-brand-primary/20",
    
    // Bottone Bianco (Usato su sfondi scuri)
    white: "bg-contrast text-brand-primary border border-gray-200 hover:bg-gray-50 focus:ring-gray-200 shadow-sm"
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
