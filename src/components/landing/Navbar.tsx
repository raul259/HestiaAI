"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-deep-forest/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 bg-electric-mint rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="#1B3022" />
              <circle cx="12" cy="15" r="2.5" fill="#88EBC0" />
            </svg>
          </span>
          <span className="font-outfit font-bold text-off-white text-lg tracking-tight">
            Hestia<span className="text-electric-mint">-AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-inter text-white/70 hover:text-electric-mint transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-inter text-white/70 hover:text-electric-mint transition-colors"
          >
            Cómo funciona
          </Link>
          <Link
            href="/host"
            className="text-sm font-inter text-white/70 hover:text-electric-mint transition-colors"
          >
            Para anfitriones
          </Link>
          <Link
            href="/guest/demo"
            className="btn-accent text-sm py-2 px-5"
          >
            Ver demo
          </Link>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-deep-forest border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <Link
            href="#features"
            className="text-sm font-inter text-white/70"
            onClick={() => setOpen(false)}
          >
            Funcionalidades
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-inter text-white/70"
            onClick={() => setOpen(false)}
          >
            Cómo funciona
          </Link>
          <Link
            href="/host"
            className="text-sm font-inter text-white/70"
            onClick={() => setOpen(false)}
          >
            Para anfitriones
          </Link>
          <Link href="/guest/demo" className="btn-accent text-sm py-2 text-center">
            Ver demo
          </Link>
        </div>
      )}
    </nav>
  );
}
