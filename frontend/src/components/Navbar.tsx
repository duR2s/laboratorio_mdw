'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReservas } from '@/context/ReservasContext';
import PixelIcon from '@/components/PixelIcon';
import ClientPortal from '@/components/ClientPortal';
import {
  useRetroAudio,
  playPauseSound,
  playMenuSelect,
  playMenuMove,
  playErrorBump,
} from '@/lib/retroAudio';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { usuarioActual, setUsuarioActual, reservas } = useReservas();
  const { isMuted, toggleMute } = useRetroAudio();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [simuladorModalMobile, setSimuladorModalMobile] = useState(false);

  const usuarioA = { id: 1, nombre: 'Juan Pérez (Alumno A)', email: 'alumnoA@universidad.edu', rol: 'ALUMNO' as const };
  const usuarioB = { id: 2, nombre: 'María López (Alumno B)', email: 'alumnoB@universidad.edu', rol: 'ALUMNO' as const };
  const usuarioAdmin = { id: 99, nombre: 'Admin Sistema', email: 'admin@universidad.edu', rol: 'ADMINISTRADOR' as const };

  const misReservasCount = reservas.filter((r) => r.usuario_id === usuarioActual?.id && r.estado === 'CONFIRMADA').length;

  const links = [
    { href: '/', label: 'Inicio', shortLabel: 'Inicio', icon: 'monitor' as const },
    { href: '/reservas', label: 'Disponibilidad', shortLabel: 'Disponibilidad', icon: 'calendar' as const },
    { href: '/mis-reservas', label: `Mis Reservas (${misReservasCount})`, shortLabel: 'Mis Reservas', icon: 'user' as const },
    { href: '/admin', label: 'Panel Admin', shortLabel: 'Admin', icon: 'terminal' as const },
  ];

  const LogoMDW = (
    <Link
      href="/"
      onClick={() => playPauseSound()}
      className="flex items-center hover:opacity-85 transition-opacity shrink-0"
      title="MDW // Laboratorio & Salas"
    >
      <svg
        viewBox="0 0 63 19"
        width={152}
        height={46}
        className={isHome ? 'h-8 sm:h-9 md:h-11 w-auto' : 'h-7 md:h-9 w-auto'}
        fill="#FFD166"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <path d="M4,0h1v1h-1z M19,0h1v1h-1z M28,0h6v1h-6z M44,0h1v1h-1z M59,0h1v1h-1z M3,1h3v1h-3z M18,1h3v1h-3z M26,1h10v1h-10z M43,1h3v1h-3z M58,1h3v1h-3z M2,2h5v1h-5z M17,2h5v1h-5z M26,2h11v1h-11z M42,2h5v1h-5z M57,2h5v1h-5z M1,3h8v1h-8z M15,3h8v1h-8z M26,3h12v1h-12z M41,3h7v1h-7z M56,3h7v1h-7z M1,4h8v1h-8z M15,4h8v1h-8z M26,4h13v1h-13z M41,4h7v1h-7z M56,4h7v1h-7z M1,5h9v1h-9z M14,5h9v1h-9z M26,5h6v1h-6z M33,5h6v1h-6z M42,5h5v1h-5z M57,5h5v1h-5z M1,6h10v1h-10z M13,6h10v1h-10z M26,6h6v1h-6z M33,6h7v1h-7z M42,6h5v1h-5z M51,6h2v1h-2z M57,6h5v1h-5z M1,7h22v1h-22z M26,7h6v1h-6z M33,7h1v1h-1z M35,7h5v1h-5z M43,7h4v1h-4z M51,7h2v1h-2z M57,7h4v1h-4z M1,8h6v1h-6z M8,8h8v1h-8z M17,8h6v1h-6z M26,8h14v1h-14z M43,8h4v1h-4z M50,8h4v1h-4z M57,8h4v1h-4z M1,9h6v1h-6z M9,9h6v1h-6z M17,9h6v1h-6z M26,9h3v1h-3z M31,9h1v1h-1z M33,9h1v1h-1z M37,9h4v1h-4z M43,9h4v1h-4z M50,9h4v1h-4z M57,9h4v1h-4z M1,10h6v1h-6z M10,10h4v1h-4z M17,10h6v1h-6z M26,10h14v1h-14z M43,10h5v1h-5z M49,10h6v1h-6z M56,10h5v1h-5z M1,11h6v1h-6z M10,11h4v1h-4z M17,11h6v1h-6z M26,11h4v1h-4z M31,11h1v1h-1z M33,11h1v1h-1z M35,11h5v1h-5z M43,11h18v1h-18z M1,12h6v1h-6z M11,12h2v1h-2z M17,12h6v1h-6z M26,12h6v1h-6z M33,12h7v1h-7z M43,12h18v1h-18z M1,13h6v1h-6z M17,13h6v1h-6z M26,13h6v1h-6z M33,13h7v1h-7z M43,13h8v1h-8z M53,13h8v1h-8z M1,14h6v1h-6z M17,14h6v1h-6z M26,14h13v1h-13z M43,14h6v1h-6z M55,14h6v1h-6z M0,15h8v1h-8z M16,15h8v1h-8z M26,15h12v1h-12z M43,15h5v1h-5z M56,15h5v1h-5z M0,16h8v1h-8z M16,16h8v1h-8z M26,16h11v1h-11z M43,16h5v1h-5z M56,16h5v1h-5z M2,17h4v1h-4z M18,17h4v1h-4z M26,17h10v1h-10z M43,17h4v1h-4z M57,17h4v1h-4z M3,18h2v1h-2z M19,18h2v1h-2z M28,18h6v1h-6z M44,18h2v1h-2z M58,18h2v1h-2z" />
      </svg>
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 bg-transparent">
        {/* ============================================================== */}
        {/* HEADER MOBILE (< md):                                          */}
        {/* En Home: Logo centrado, mini HUD en sm, y Usuario a la derecha */}
        {/* En otras páginas: Logo a la izq y Usuario a la der.            */}
        {/* ============================================================== */}
        <div className="relative flex md:hidden items-center justify-between px-4 py-2.5 w-full">
          {isHome ? (
            <>
              {/* Mini HUD Arcade en pantallas intermedias sm */}
              <div className="hidden sm:flex items-center gap-2 text-[#FFFAEB] font-pixel text-sm tracking-wider z-10 select-none">
                <span className="font-bold text-[#FFD166]">1UP</span>
                <PixelIcon name="heart" size={18} color="#EF476F" className="animate-pulse" />
                <PixelIcon name="heart-outline" size={18} color="#FFFAEB" className="opacity-60" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                {LogoMDW}
              </div>
            </>
          ) : (
            LogoMDW
          )}

          {/* A la derecha: Botón simulador + Usuario redondo con relleno */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Botón para el simulador de usuarios a la izquierda del usuario */}
            <button
              type="button"
              onClick={() => {
                playMenuMove();
                setSimuladorModalMobile(true);
              }}
              className="flex items-center gap-1 border-2 border-[#FFFAEB] bg-transparent px-2 py-1 font-pixel text-[11px] font-bold text-[#FFFAEB] hover:text-[#FFD166] hover:border-[#FFD166] transition-colors"
              title="Abrir simulador de usuarios"
            >
              <PixelIcon name="refresh" size={12} color="#FFFAEB" />
              <span>Simular</span>
            </button>

            {/* Usuario redondo con relleno de color #FFD166 */}
            {usuarioActual ? (
              <Link
                href="/login"
                onClick={() => playPauseSound()}
                className="flex items-center gap-1.5 rounded-full border-2 border-[#FFFAEB] bg-[#FFD166] px-2.5 py-1 text-xs font-pixel text-[#0D5167] hover:bg-[#ffe08a] transition-colors shadow-sm"
              >
                <div className="h-2.5 w-2.5 rounded-full border border-[#073B4C] bg-[#06D6A0]" />
                <span className="font-bold uppercase truncate max-w-[80px]">
                  {usuarioActual.nombre.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => playPauseSound()}
                className="px-3 py-1 rounded-full border-2 border-[#FFFAEB] bg-[#FFD166] text-[#0D5167] font-pixel text-xs font-bold uppercase hover:bg-[#ffe08a] transition-colors shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* HEADER IPAD & DESKTOP (>= md):                                 */}
        {/* En Home: HUD Arcade a la izq + Logo centrado + Usuario a la der*/}
        {/* En otras páginas: Logo + navs a la izq + Usuario a la derecha  */}
        {/* ============================================================== */}
        <div className="relative hidden md:flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-3.5 sm:px-6">
          {isHome ? (
            <>
              {/* HUD Arcade a la izquierda en Home (1UP y 3 Corazones) */}
              <div className="flex items-center gap-3 text-[#FFFAEB] font-pixel tracking-[0.05em] z-10 select-none">
                <span className="font-bold text-[#FFD166] text-lg lg:text-[22px] leading-8 mr-0.5">
                  1UP
                </span>
                {/* Corazón lleno en pixel art */}
                <PixelIcon
                  name="heart"
                  size={26}
                  color="#EF476F"
                  className="w-6 h-6 lg:w-[26px] lg:h-[26px] animate-pulse"
                />
                {/* Corazones vacíos en pixel art */}
                <PixelIcon
                  name="heart-outline"
                  size={26}
                  color="#FFFAEB"
                  className="w-6 h-6 lg:w-[26px] lg:h-[26px] opacity-60"
                />
                <PixelIcon
                  name="heart-outline"
                  size={26}
                  color="#FFFAEB"
                  className="w-6 h-6 lg:w-[26px] lg:h-[26px] opacity-60"
                />
              </div>

              {/* Logo centrado cuando estamos en Home */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                {LogoMDW}
              </div>
            </>
          ) : (
            /* Logo y Enlaces de Navegación después de él en páginas internas */
            <div className="flex items-center gap-5 lg:gap-8 min-w-0">
              {LogoMDW}

              {/* Enlaces de Navegación después del logo */}
              <div className="flex items-center gap-1.5 lg:gap-3 flex-wrap">
                {links.map((link) => {
                  const activo = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => playPauseSound()}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1 font-pixel text-xs font-bold uppercase transition-colors ${
                        activo
                          ? 'text-[#06D6A0] bg-transparent border-0'
                          : 'text-[#FFFAEB] bg-transparent border-0 hover:text-[#FFD166]'
                      }`}
                    >
                      <PixelIcon
                        name={link.icon}
                        size={14}
                        color={activo ? '#06D6A0' : '#FFFAEB'}
                      />
                      <span className="whitespace-nowrap">
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* En la esquina derecha: Avatar REDONDO con relleno #FFD166 (Figma 33:2267: 56x56px, radius full) */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-[#FFFAEB] bg-[#FFD166] hover:bg-[#ffe08a] flex flex-col items-center justify-between py-2 px-1.5 relative select-none shadow-md transition-colors">
                {/* Círculo de estado activo arriba (#06D6A0) */}
                <span className="w-3 h-3 rounded-full border border-[#073B4C] bg-[#06D6A0] shrink-0 mt-0.5" />

                {/* Debajo y centrado el nombre del usuario en #0D5167 */}
                <Link
                  href="/login"
                  onClick={() => playPauseSound()}
                  className="font-pixel text-[10px] font-bold text-[#0D5167] uppercase truncate max-w-[42px] text-center hover:text-[#073B4C] transition-colors leading-none mb-0.5"
                  title={usuarioActual ? usuarioActual.nombre : 'Iniciar sesión'}
                >
                  {usuarioActual ? usuarioActual.nombre.split(' ')[0] : 'Invitado'}
                </Link>

                {/* Flecha hacia abajo a la derecha dentro del círculo: dropdown de simulación */}
                <button
                  type="button"
                  onClick={() => {
                    if (dropdownOpen) {
                      playErrorBump();
                    } else {
                      playMenuMove();
                    }
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-[#0D5167] hover:text-[#073B4C] transition-colors cursor-pointer"
                  title="Abrir selector de simulación"
                >
                  <PixelIcon name="chevron-down" size={10} color="#0D5167" />
                </button>
              </div>

            {/* Dropdown del Selector de Simulación */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 border-3 border-[#dd6902] bg-[#ffdf88] p-3 text-[#073B4C] shadow-2xl z-50">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#dd6902]/30 mb-2">
                  <span className="font-pixel text-[10px] font-bold uppercase text-[#073B4C]">
                    {'//'} SIMULAR USUARIO
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playErrorBump();
                      setDropdownOpen(false);
                    }}
                    className="font-pixel text-xs font-bold text-[#e11d48] hover:opacity-80"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playMenuSelect();
                      setUsuarioActual(usuarioA);
                      setDropdownOpen(false);
                    }}
                    className={`w-full p-2 text-left font-pixel text-xs font-bold border-2 transition-all flex items-center justify-between ${
                      usuarioActual?.id === usuarioA.id
                        ? 'border-[#0284c7] bg-[#bae6fd] text-[#073B4C]'
                        : 'border-[#dd6902] bg-[#fef3c7] text-[#073B4C] hover:bg-[#ffb220]/40'
                    }`}
                  >
                    <span>Alumno A (Juan)</span>
                    {usuarioActual?.id === usuarioA.id && <PixelIcon name="check" size={12} color="#073B4C" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playMenuSelect();
                      setUsuarioActual(usuarioB);
                      setDropdownOpen(false);
                    }}
                    className={`w-full p-2 text-left font-pixel text-xs font-bold border-2 transition-all flex items-center justify-between ${
                      usuarioActual?.id === usuarioB.id
                        ? 'border-[#0284c7] bg-[#bae6fd] text-[#073B4C]'
                        : 'border-[#dd6902] bg-[#fef3c7] text-[#073B4C] hover:bg-[#ffb220]/40'
                    }`}
                  >
                    <span>Alumno B (María)</span>
                    {usuarioActual?.id === usuarioB.id && <PixelIcon name="check" size={12} color="#073B4C" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playMenuSelect();
                      setUsuarioActual(usuarioAdmin);
                      setDropdownOpen(false);
                    }}
                    className={`w-full p-2 text-left font-pixel text-xs font-bold border-2 transition-all flex items-center justify-between ${
                      usuarioActual?.id === usuarioAdmin.id
                        ? 'border-[#e11d48] bg-[#fecdd3] text-[#073B4C]'
                        : 'border-[#dd6902] bg-[#fef3c7] text-[#073B4C] hover:bg-[#ffb220]/40'
                    }`}
                  >
                    <span>Admin Sistema</span>
                    {usuarioActual?.id === usuarioAdmin.id && <PixelIcon name="check" size={12} color="#073B4C" />}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================================== */}
      {/* ELEMENTOS FIXED FUERA DEL WRAPPER (PORTAL A BODY)             */}
      {/* Necesario para evitar conflictos con 'transform' de GSAP      */}
      {/* ScrollSmoother, asegurando que sigan fijos en la ventana.       */}
      {/* ============================================================== */}
      <ClientPortal>
        {/* BOTÓN DE AUDIO EN ESQUINA INFERIOR DERECHA */}
        <button
          type="button"
          onClick={toggleMute}
          className={`fixed right-5 ${
            isHome ? 'bottom-5' : 'bottom-20 md:bottom-5'
          } z-40 p-1 text-white hover:opacity-80 active:scale-95 transition-opacity select-none cursor-pointer drop-shadow-[0_2px_0_#073B4C]`}
          title={isMuted ? 'Activar efectos de sonido 8-bit (NES)' : 'Silenciar efectos de sonido 8-bit'}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
        >
          <PixelIcon
            key={isMuted ? 'volume-off' : 'volume-on'}
            name={isMuted ? 'volume-off' : 'volume-on'}
            size={34}
            color="#FFFFFF"
          />
        </button>

        {/* NAVEGACIÓN FIJA INFERIOR PARA MOBILE (md:hidden, oculta en Home) */}
        {!isHome && (
          <aside
            aria-label="Navegación móvil"
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t-4 border-[#dd6902] bg-[#ffdf88] shadow-2xl"
          >
            <div className="grid grid-cols-4 items-center h-16 text-[#073B4C]">
              {links.map((link) => {
                const activo = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => playPauseSound()}
                    className={`flex flex-col items-center justify-center h-full px-1 py-1 text-center transition-all ${
                      activo
                        ? 'bg-[#ffb220] border-t-2 border-[#dd6902] text-[#073B4C]'
                        : 'text-[#073B4C]/80 hover:bg-[#ffb220]/30'
                    }`}
                  >
                    <PixelIcon
                      name={link.icon}
                      size={18}
                      color={activo ? '#06D6A0' : '#073B4C'}
                    />
                    <span
                      className={`font-pixel text-[9px] uppercase font-bold tracking-tight mt-1 leading-tight truncate max-w-full ${
                        activo ? 'text-[#073B4C]' : 'text-[#073B4C]/85'
                      }`}
                    >
                      {link.shortLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        {/* Modal Popup para simulación de usuarios en Mobile */}
        {simuladorModalMobile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:hidden backdrop-blur-none">
            <div className="w-full max-w-xs border-4 border-[#dd6902] bg-[#ffdf88] p-4 text-[#073B4C] shadow-2xl">
              <div className="flex items-center justify-between border-b-2 border-[#dd6902]/30 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-pixel text-xs font-bold uppercase text-[#073B4C]">Simular Usuario</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playErrorBump();
                    setSimuladorModalMobile(false);
                  }}
                  className="font-pixel font-bold text-xs p-1 text-[#e11d48]"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    playMenuSelect();
                    setUsuarioActual(usuarioA);
                    setSimuladorModalMobile(false);
                  }}
                  className={`w-full p-2.5 text-left font-pixel text-xs font-bold border-2 transition-all flex items-center justify-between ${
                    usuarioActual?.id === usuarioA.id
                      ? 'border-[#0284c7] bg-[#bae6fd] text-[#073B4C]'
                      : 'border-[#dd6902] bg-[#fef3c7] text-[#073B4C]'
                  }`}
                >
                  <span>Alumno A (Juan)</span>
                  {usuarioActual?.id === usuarioA.id && <PixelIcon name="check" size={12} color="#073B4C" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMenuSelect();
                    setUsuarioActual(usuarioB);
                    setSimuladorModalMobile(false);
                  }}
                  className={`w-full p-2.5 text-left font-pixel text-xs font-bold border-2 transition-all flex items-center justify-between ${
                    usuarioActual?.id === usuarioB.id
                      ? 'border-[#0284c7] bg-[#bae6fd] text-[#073B4C]'
                      : 'border-[#dd6902] bg-[#fef3c7] text-[#073B4C]'
                  }`}
                >
                  <span>Alumno B (María)</span>
                  {usuarioActual?.id === usuarioB.id && <PixelIcon name="check" size={12} color="#073B4C" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMenuSelect();
                    setUsuarioActual(usuarioAdmin);
                    setSimuladorModalMobile(false);
                  }}
                  className={`w-full p-2.5 text-left font-pixel text-xs font-bold border-2 transition-all flex items-center justify-between ${
                    usuarioActual?.id === usuarioAdmin.id
                      ? 'border-[#e11d48] bg-[#fecdd3] text-[#073B4C]'
                      : 'border-[#dd6902] bg-[#fef3c7] text-[#073B4C]'
                  }`}
                >
                  <span>Admin Sistema</span>
                  {usuarioActual?.id === usuarioAdmin.id && <PixelIcon name="check" size={12} color="#073B4C" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </ClientPortal>
    </>
  );
}
