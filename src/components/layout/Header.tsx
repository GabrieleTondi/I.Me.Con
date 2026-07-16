"use client";

import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/app/actions/auth-actions';

interface CurrentUser {
  id: number;
  nomeCognome: string;
  email: string;
  username: string;
  ruoli: string[];
  areaIds: number[];
}

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res?.success) {
      setUser(null);
      setShowDropdown(false);
      window.location.href = "/";
    }
  };

  // LOGICA E DATI: Cambia i nomi qui per modificare i link della navigazione
  const links = [
    { name: 'Home', href: '/' },
    { name: 'Chi Siamo', href: '/chi-siamo' },
    { name: 'Dove siamo', href: '/dove-siamo' },
    { name: 'Contatti', href: '/contatti' },
    { name: 'News', href: '/news' },
  ];

  return (
    /* FORMA COMPONENTE NAVBAR: "absolute" permette all'header di sedersi SOPRA la sezione Hero sottostante */
    <header className="absolute top-0 left-0 right-0 z-50 p-6 md:px-12 flex items-center justify-between">
      
      {/* FORMA E LOGO: Il logo fluttua a sinistra all'avvio. */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center"
      >
        <Image 
          src="/logo.png" 
          alt="I.Me.Con Logo" 
          width={220}
          height={60}
          priority
          /* DIMENSIONE LOGO: h-10 su mobile, h-14 su desktop. */
          className="h-10 md:h-14 w-auto object-contain"
        />
      </motion.div>

      {/* BLOCCO MENU DESKTOP */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        /* COLORE SFONDO BARRA: bg-white/10 aggiunge bianco trasparente per isolarsi ma vedere dietro (effetto vetro con backdrop-blur-md) */
        className="hidden lg:flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 shadow-sm"
      >
        {links.map((link, i) => (
          /* COLORE LINK: text-contrast/90 (Bianco opaco), hover:text-brand-accent (Diventa arancio al passaggio del mouse!) */
          <a key={i} href={link.href} className="text-contrast/90 hover:text-brand-accent text-sm transition-colors hover:underline underline-offset-4 font-medium">
            {link.name}
          </a>
        ))}
      </motion.nav>

      {/* BLOCCO LOG IN (Visibile solo nel desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} // Appare da destra
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:block relative"
      >
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-5 py-2 hover:bg-white/20 transition-all font-medium text-sm cursor-pointer"
            >
              <span>Ciao, {user.nomeCognome.split(" ")[0]}</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-brand-primary border border-white/10 rounded-xl shadow-xl p-2 z-50 text-sm"
              >
                <div className="px-3 py-2 border-b border-white/10 text-xs text-white/60">
                  Ruolo: <span className="font-semibold text-brand-accent">{user.ruoli[0] || "Utente"}</span>
                </div>
                {user.ruoli.includes("Amministratore") && (
                  <Link href="/gestionale">
                    <span className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-white hover:bg-white/10 rounded-lg text-left transition-colors cursor-pointer block">
                      Vai al gestionale
                    </span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-white hover:bg-white/10 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Disconnetti</span>
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" className="text-sm px-5 py-2 rounded-full !text-base">Accedi</Button>
          </Link>
        )}
      </motion.div>

      {/* ICONA MENU MOBILE (Le lineette "Hamburger") */}
      <button className="lg:hidden text-contrast z-50 relative" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} className="text-contrast" /> : <Menu size={28} />}
      </button>

      {/* MENU A TENDINA MOBILE ESPANDIBILE */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          /* COLORE PANNELLO MOBILE: bg-brand-primary (#064789). Scende sopra a tutto con la shadow-xl */
          className="absolute top-full left-0 right-0 bg-brand-primary p-6 flex flex-col gap-4 shadow-xl z-40 lg:hidden"
        >
          {links.map((link, i) => (
            <a key={i} href={link.href} className="text-contrast text-lg hover:bg-brand-secondary p-2 rounded">
              {link.name}
            </a>
          ))}
          {user ? (
            <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-4">
              <div className="text-white/60 text-sm px-2 mb-2">
                Ciao, <span className="font-medium text-white">{user.nomeCognome}</span> ({user.ruoli[0] || "Utente"})
              </div>
              {user.ruoli.includes("Amministratore") && (
                <Link href="/gestionale">
                  <Button variant="secondary" className="w-full justify-start gap-2 !text-lg mb-2">
                    Vai al gestionale
                  </Button>
                </Link>
              )}
              <Button variant="secondary" onClick={handleLogout} className="w-full justify-start gap-2 !text-lg bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-900/30">
                <LogOut size={18} />
                Disconnetti
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="secondary" className="w-full mt-2 !text-lg">Accedi</Button>
            </Link>
          )}
        </motion.div>
      )}
    </header>
  );
};

