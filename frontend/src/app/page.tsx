'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PixelIcon from '@/components/PixelIcon';
import { playMenuMove, playPauseSound } from '@/lib/retroAudio';

const MENU_ITEMS = [
  { label: 'Disponibilidad', href: '/reservas' },
  { label: 'MIS RESERVAS', href: '/mis-reservas' },
  { label: 'Mi Cuenta', href: '/login' },
  { label: '¿PANEL ADMIN?', href: '/admin' },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTriangleBlinking, setIsTriangleBlinking] = useState(false);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (idx: number) => {
      if (isConfirming) return;
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

      setSelectedIndex(idx);
      setIsConfirming(true);
      setIsTriangleBlinking(true);

      // Sonido de Pausa NES para cambio de página / navegación
      playPauseSound();

      // Espera 0.6s (600ms) antes de navegar a la página seleccionada
      navTimerRef.current = setTimeout(() => {
        router.push(MENU_ITEMS[idx].href);
      }, 600);
    },
    [isConfirming, router]
  );

  // Navegación por teclado (Flechas arriba/abajo y Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isConfirming) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        playMenuMove();
        setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playMenuMove();
        setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(selectedIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, isConfirming, handleSelect]);

  // Suavizado ligero en el eje vertical al pasar el mouse para evitar disparos encimados
  const handleOptionHover = (idx: number) => {
    if (isConfirming || selectedIndex === idx) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      playMenuMove();
      setSelectedIndex(idx);
    }, 45);
  };

  const handleOptionLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen text-neo-dark flex flex-col relative select-none">
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar Transparente Superior (se vuelve sólido #073B4C con scroll) */}
        <Navbar />

        {/* Contenido Principal con Distribución de Cartel Retro Arcade */}
        <main className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 lg:py-8 w-full min-w-0 box-border">
          {/* Recuadro que rodea exclusivamente el Título y el Seleccionador (expandido al ancho del título en Press Start 2P) */}
          <div className="w-fit max-w-[95vw] mx-auto flex flex-col items-center relative py-6 sm:py-8 px-4 sm:px-10 lg:px-14 border-2 border-transparent bg-transparent">
            {/* Esquinas Neobrutalistas / Retro Brackets */}
            <span className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-[#FFFAEB]" />
            <span className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-[#FFFAEB]" />
            <span className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-[#FFFAEB]" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-[#FFFAEB]" />

            {/* Gran Título Centrado en 2 Líneas con Press Start 2P (Proporción 1:2 de Figma: 48px arriba / 96px abajo en desktop) */}
            <div className="my-2 sm:my-4 text-center px-2">
              <h1 className="font-arcade font-normal uppercase [text-shadow:0_2px_0_#073B4C] whitespace-nowrap">
                <span className="block text-base sm:text-2xl md:text-3xl lg:text-[42px] xl:text-[48px] text-white mb-3 sm:mb-5 tracking-[0.1em] leading-tight">
                  Reserva tu
                </span>
                <span className="block text-2xl sm:text-5xl md:text-6xl lg:text-[76px] xl:text-[96px] text-[#FFD166] tracking-[0.05em] leading-[1.15]">
                  Laboratorio
                </span>
              </h1>
            </div>

            {/* Menú Interactivo Vertical en Press Start 2P (Proporción Figma: 32px base -> 40px seleccionado):
                1) Primero cambia color y aparece la flecha al instante (duration-0).
                2) Luego aumenta el tamaño con 1 frame intermedio (steps(2, end)) estilo juego retro 8-bit.
                3) Al hacer click: sonido de Pausa, a los 0.2s parpadea el triángulo y a los 0.6s cambia de página. */}
            <div
              onMouseLeave={handleOptionLeave}
              className="my-6 sm:my-8 w-full max-w-xl lg:max-w-2xl h-[220px] sm:h-[260px] lg:h-[300px] flex flex-col items-center justify-center gap-3 sm:gap-4 font-arcade shrink-0"
            >
              {MENU_ITEMS.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const shouldBlink = isSelected && isConfirming && isTriangleBlinking;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => handleOptionHover(idx)}
                    className={`group w-full h-11 sm:h-13 lg:h-16 flex items-center justify-center gap-2.5 sm:gap-3.5 text-center font-normal tracking-[0.14em] uppercase leading-none whitespace-nowrap shrink-0 text-sm sm:text-xl md:text-2xl lg:text-[32px] origin-center transition-transform [transition-timing-function:steps(2,end)] ${
                      isSelected
                        ? 'text-[#06D6A0] scale-[1.18] sm:scale-[1.22] lg:scale-[1.25] duration-[90ms]'
                        : 'text-[#FFFAEB]/85 hover:text-white scale-100 duration-0'
                    }`}
                  >
                    {/* Ícono Play Pixelado Cursor: fijo en hover normal, parpadea en 8-bit 0.4s después del click */}
                    <span
                      className={`inline-flex items-center justify-center w-6 sm:w-8 lg:w-10 shrink-0 ${
                        isSelected ? 'opacity-100 text-[#06D6A0]' : 'opacity-0'
                      } ${shouldBlink ? 'anim-triangle-retro-blink' : ''}`}
                    >
                      <PixelIcon
                        name="play"
                        size={36}
                        color="#06D6A0"
                        className="w-5 h-5 sm:w-7 sm:h-7 lg:w-9 lg:h-9"
                      />
                    </span>

                    <span>{item.label}</span>

                    {/* Espaciador invisible para balancear y centrar el texto con el icono */}
                    <span
                      className="inline-block w-6 sm:w-8 lg:w-10 shrink-0 opacity-0"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            <style jsx>{`
              @keyframes retroTriangleBlink {
                0%, 49.99% {
                  opacity: 0;
                }
                50%, 100% {
                  opacity: 1;
                }
              }
              .anim-triangle-retro-blink {
                animation: retroTriangleBlink 0.12s steps(1, end) infinite;
              }
            `}</style>
          </div>

          {/* Contenedor Principal de la Ventana Retro (mismo max-w de 80rem del nav con 1.5rem / px-6 de padding) */}
          <div className="w-full max-w-[80rem] mx-auto px-6 mt-6 sm:mt-8">
            <div className="w-full border-4 border-[#dd6902] bg-[#ffdf88] overflow-hidden">
              {/* Cabecera de la Ventana en #ffb220 con Borde #dd6902 (sin los círculos de Mac) */}
              <div className="bg-[#ffb220] px-3.5 py-2 flex items-center justify-between border-b-[3px] border-[#dd6902]">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[#073B4C]">
                    labreserva_system.exe
                  </span>
                </div>

                {/* Controles Retro de Ventana */}
                <div className="flex items-center gap-1 font-pixel text-xs font-bold">
                  <span className="w-4 h-4 flex items-center justify-center border-2 border-[#dd6902] bg-[#ffdf88] text-[#073B4C] text-[10px] leading-none select-none">_</span>
                  <span className="w-4 h-4 flex items-center justify-center border-2 border-[#dd6902] bg-[#ffdf88] text-[#073B4C] text-[9px] leading-none select-none">□</span>
                  <span className="w-4 h-4 flex items-center justify-center border-2 border-[#dd6902] bg-[#EF476F] text-white text-[10px] leading-none select-none">✕</span>
                </div>
              </div>

              {/* Cuerpo de la Ventana con fondo #ffdf88, texto #073B4C y remates #118AB2 */}
              <div className="p-4 sm:p-6 space-y-4 text-[#073B4C]">
                {/* Divisor Punteado Central con Cruz en Pixel Art */}
                <div className="w-full flex items-center justify-center gap-2.5 my-1">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={`l-${i}`} className="w-1.5 h-1.5 bg-[#dd6902]/35" />
                    ))}
                  </div>
                  {/* Cruz Pixel Art con Remate de Color #118AB2 */}
                  <svg width={10} height={10} viewBox="0 0 5 5" className="shrink-0" style={{ shapeRendering: 'crispEdges' }}>
                    <path d="M0 0h1v1H0zm4 0h1v1H4zm-1 1h1v1H3zm-2 0h1v1H1zm1 1h1v1H2zm-1 1h1v1H1zm2 0h1v1H3zm-3 1h1v1H0zm4 0h1v1H4z" fill="#118AB2" />
                  </svg>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={`r-${i}`} className="w-1.5 h-1.5 bg-[#dd6902]/35" />
                    ))}
                  </div>
                </div>

                {/* Lemas y Subtítulos en Dos Líneas */}
                <div className="text-center font-pixel text-xs sm:text-sm tracking-wider uppercase my-2 space-y-1">
                  <p className="text-[#073B4C] font-bold">
                    SISTEMA UNIVERSITARIO DE RESERVAS Y LABORATORIOS.
                  </p>
                  <p className="text-[#118AB2] font-bold tracking-widest text-[11px] sm:text-xs">
                    CONTROL DE CONCURRENCIA OPTIMISTA · TRANSACCIONES ACID PURAS.
                  </p>
                </div>

                {/* Divisor con Ícono de Gamepad Pixel Art */}
                <div className="w-full flex items-center justify-center gap-3 my-2">
                  <span className="h-0.5 w-12 sm:w-16 bg-[#dd6902]/30" />
                  <PixelIcon name="gamepad" size={20} color="#118AB2" />
                  <span className="h-0.5 w-12 sm:w-16 bg-[#dd6902]/30" />
                </div>

                {/* Sección Interior: 3 Columnas (FOCUS, PERSIST, VICTORY) con Borde #dd6902 y fondo #ffb220/20 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-center mt-2 pt-1 border-2 border-[#dd6902] bg-[#ffb220]/25 p-3">
                  {/* Columna 1: Enfoque / Disponibilidad */}
                  <div className="flex flex-col items-center space-y-1 p-1">
                    <PixelIcon name="crosshair" size={24} color="#118AB2" />
                    <h4 className="font-pixel text-xs font-bold uppercase text-[#118AB2] tracking-wider">
                      DISPONIBILIDAD
                    </h4>
                    <p className="font-body text-[11px] text-[#073B4C]/90 leading-snug">
                      WebSockets en vivo. Horarios sin recarga.
                    </p>
                  </div>

                  {/* Columna 2: Persistencia / Bloqueo Optimista */}
                  <div className="flex flex-col items-center space-y-1 p-1 sm:border-x-2 sm:border-[#dd6902]/30">
                    <PixelIcon name="heart" size={24} color="#118AB2" />
                    <h4 className="font-pixel text-xs font-bold uppercase text-[#118AB2] tracking-wider">
                      ANTI-OVERBOOK
                    </h4>
                    <p className="font-body text-[11px] text-[#073B4C]/90 leading-snug">
                      Bloqueo optimista. Cero dobles reservas.
                    </p>
                  </div>

                  {/* Columna 3: Eficiencia / BullMQ */}
                  <div className="flex flex-col items-center space-y-1 p-1">
                    <PixelIcon name="trophy" size={24} color="#118AB2" />
                    <h4 className="font-pixel text-xs font-bold uppercase text-[#118AB2] tracking-wider">
                      BULLMQ REDIS
                    </h4>
                    <p className="font-body text-[11px] text-[#073B4C]/90 leading-snug">
                      Colas asíncronas. Correos al instante.
                    </p>
                  </div>
                </div>

                {/* Badge / Pill Inferior Enmarcado en #ffb220 con Borde #dd6902 */}
                <div className="mt-3 border-2 border-[#dd6902] bg-[#ffb220] px-4 py-1 text-center">
                  <span className="font-pixel text-[11px] font-bold uppercase tracking-widest text-[#073B4C]">
                    LABRESERVA · MDW V1.0 ACID
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
