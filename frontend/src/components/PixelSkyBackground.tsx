'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

type StarType = 'cross-vertical' | 'cross-horizontal' | 'dot-to-cross';
type StarColor = '#118AB2' | '#EF476F' | '#FFD166';

interface StarConfig {
  id: number;
  top: string;
  left: string;
  color: StarColor;
  type: StarType;
  delay: string;
}

// Generador inteligente de estrellas en las 5 franjas del cielo:
// - Reduce la cantidad de estrellas a la mitad (~12 en desktop, ~7 en mobile).
// - Coloca estrellas prioritariamente en la esquina superior izquierda.
// - Evita colisionar con texto, iconos, botones y usuario con un margen de 1rem (16px).
function generateCollisionFreeStars(
  skyRect: DOMRect,
  contentEl: HTMLElement
): StarConfig[] {
  const remPx =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // Margen de 1rem alrededor del elemento (16px) + radio máximo de estrella (15px)
  const margin = remPx + 15;

  const width = skyRect.width;
  const height = skyRect.height;
  if (width <= 0 || height <= 0) return [];

  // Calcular área visible para pantallas móviles comprimidas al ancho mínimo de iPad (768px)
  const screenW = typeof window !== 'undefined' ? window.innerWidth : width;
  const visibleLeft = Math.max(0, (width - screenW) / 2);

  // Recolectar cajas de exclusión de texto, iconos, usuario y elementos interactivos
  const allElements = contentEl.querySelectorAll('*');
  const exclusionBoxes: { left: number; top: number; right: number; bottom: number }[] = [];

  allElements.forEach((el) => {
    const isSvgOrImg = el instanceof SVGElement || el.tagName === 'SVG' || el.tagName === 'IMG';
    const isControl =
      el.tagName === 'BUTTON' ||
      el.tagName === 'A' ||
      el.tagName === 'INPUT' ||
      el.tagName === 'SELECT' ||
      el.tagName === 'LABEL';
    const isHeading = /^H[1-6]$/.test(el.tagName);
    const isTextLeaf =
      (el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'CODE' || el.tagName === 'PRE') &&
      ((el.textContent?.trim().length || 0) > 0 || el.className.includes('border'));
    const isUserOrBadge =
      el.classList.contains('rounded-full') ||
      el.getAttribute('href')?.includes('login') ||
      false;

    if (!isSvgOrImg && !isControl && !isHeading && !isTextLeaf && !isUserOrBadge) {
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const elOffsetTop = rect.top - skyRect.top;
    const elOffsetLeft = rect.left - skyRect.left;

    // Solo considerar elementos dentro de la altura del cielo
    if (elOffsetTop > height || elOffsetTop + rect.height < 0) return;

    exclusionBoxes.push({
      left: elOffsetLeft - margin,
      top: elOffsetTop - margin,
      right: elOffsetLeft + rect.width + margin,
      bottom: elOffsetTop + rect.height + margin,
    });
  });

  const colors: StarColor[] = ['#FFD166', '#118AB2', '#EF476F'];
  const types: StarType[] = ['dot-to-cross', 'cross-vertical', 'cross-horizontal'];
  const delays = ['0s', '0.4s', '0.8s', '1.2s', '1.6s', '2.0s', '2.4s', '2.8s'];

  // Semilla fija pseudo-aleatoria para distribución estable en render
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const stars: StarConfig[] = [];
  const isDesktop = screenW > 768;

  // 5 Franjas verticales exactas (20% cada una)
  for (let f = 0; f < 5; f++) {
    const yMin = (f / 5) * height + 16;
    const yMax = ((f + 1) / 5) * height - 16;
    let placed = 0;
    let attempts = 0;
    const maxAttempts = 100;

    // Reducir la cantidad de estrellas a la mitad (~12 total en desktop, ~7 en mobile)
    const targetPerFranja = isDesktop ? (f % 2 === 0 ? 2 : 3) : (f % 2 === 0 ? 1 : 2);

    while (placed < targetPerFranja && attempts < maxAttempts) {
      attempts++;

      let x: number;
      let y: number;

      // Colocar prioritariamente estrellas en la esquina superior izquierda (Franjas 0 y 1)
      if ((f === 0 || f === 1) && placed === 0 && attempts < 30) {
        x = visibleLeft + 24 + rand() * Math.min(180, screenW * 0.35);
        y = yMin + rand() * (yMax - yMin);
      } else {
        // Distribuir en el área visible de la pantalla del centro hacia afuera
        x = visibleLeft + 24 + rand() * Math.max(48, screenW - 48);
        y = yMin + rand() * (yMax - yMin);
      }

      // 1. Colisión con cajas de exclusión (texto, iconos, usuario)
      let collides = false;
      for (const box of exclusionBoxes) {
        if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
          collides = true;
          break;
        }
      }
      if (collides) continue;

      // 2. Distancia mínima entre estrellas
      let tooClose = false;
      for (const st of stars) {
        const sx = (parseFloat(st.left) / 100) * width;
        const sy = (parseFloat(st.top) / 100) * height;
        const dist = Math.hypot(sx - x, sy - y);
        if (dist < (isDesktop ? 55 : 40)) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const starId = stars.length + 1;
      stars.push({
        id: starId,
        top: `${((y / height) * 100).toFixed(2)}%`,
        left: `${((x / width) * 100).toFixed(2)}%`,
        color: colors[starId % colors.length],
        type: types[starId % types.length],
        delay: delays[starId % delays.length],
      });
      placed++;
    }
  }

  return stars;
}


const HORIZON_LAYERS = [
  { id: 'horizon-layer-1', src: '/assets/pixel/backgrounds/horizon_bg_layer1.svg', zIndex: 1, distanceRem: 0 },
  { id: 'horizon-layer-2', src: '/assets/pixel/backgrounds/horizon_bg_layer2.svg', zIndex: 2, distanceRem: 9.6 },
  { id: 'horizon-layer-3', src: '/assets/pixel/backgrounds/horizon_bg_layer3.svg', zIndex: 3, distanceRem: 19.2 },
  { id: 'horizon-layer-4', src: '/assets/pixel/backgrounds/horizon_bg_layer4.svg', zIndex: 4, distanceRem: 28.8 },
] as const;

// Recorrido del pin (en % del viewport)
const PIN_SCROLL_DISTANCE = '+=120%';

interface PixelSkyBackgroundProps {
  children?: React.ReactNode;
}

export default function PixelSkyBackground({ children }: PixelSkyBackgroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const horizonSectionRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<StarConfig[]>([]);
  const [isFigmaMode, setIsFigmaMode] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const pathname = usePathname();

  const updateLayout = useCallback(() => {
    if (!skyRef.current || !contentRef.current) return;
    const skyRect = skyRef.current.getBoundingClientRect();
    if (skyRect.width === 0 || skyRect.height === 0) return;

    // 1. Generación de estrellas libres de colisión en las 5 franjas
    const generated = generateCollisionFreeStars(skyRect, contentRef.current);
    setStars(generated);

    // 2. Medir la altura del contenido de la UI para garantizar que el scroll wrapper lo contenga
    const contentH = contentRef.current.offsetHeight;
    setContentHeight(contentH);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('figma=1')) {
      setIsFigmaMode(true);
    }
  }, []);

  useEffect(() => {
    // Retardo breve para asegurar que Next.js y los componentes hijos han montado el DOM
    const timer = setTimeout(updateLayout, 60);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        updateLayout();
      });
    }

    // Observer para recalcular ante cambios de tamaño del contenido de UI
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && contentRef.current) {
      ro = new ResizeObserver(() => {
        updateLayout();
      });
      ro.observe(contentRef.current);
    }

    window.addEventListener('resize', updateLayout);
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [pathname, updateLayout]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }, [contentHeight]);

  useGSAP(
    () => {
      // Modo captura para html.to.design / Figma: NO inicializar ScrollSmoother ni ScrollTrigger con pin
      if (typeof window !== 'undefined' && window.location.search.includes('figma=1')) {
        return;
      }

      const smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.2,
        effects: true,
        smoothTouch: 0.1,
      });

      // Timeline con scrub + pin: las capas 2-4 suben a velocidad constante en el primer 80%
      // y desaceleran en el último 20% hasta llegar a su posición objetivo.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: horizonSectionRef.current,
          start: 'top top',
          end: PIN_SCROLL_DISTANCE,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Duraciones de fase de recorrido:
      // - Fase 1 (primer 80% de distancia): ritmo fluido y constante ('none').
      // - Fase 2 (último 20% de distancia): requiere mayor esfuerzo de scroll y desacelera ('power2.out').
      const PHASE_1_DURATION = 0.8;
      const PHASE_2_DURATION = 0.6;

      HORIZON_LAYERS.forEach((layer) => {
        if (layer.distanceRem === 0) return;
        const target = `.horizon-layer[data-layer="${layer.id}"]`;
        const initialRem = layer.distanceRem;
        const remaining20PercentRem = initialRem * 0.2; // Marca del 20% restante

        // Fase 1: Recorre del 100% al 20% de distancia (80% completado)
        tl.fromTo(
          target,
          { y: `${initialRem}rem` },
          { y: `${remaining20PercentRem}rem`, duration: PHASE_1_DURATION, ease: 'none' },
          0 // Inicia al comienzo del timeline
        );

        // Fase 2: Recorre el último 20% de distancia hasta 0 con mayor resistencia y desaceleración
        tl.to(
          target,
          { y: 0, duration: PHASE_2_DURATION, ease: 'power2.out' },
          PHASE_1_DURATION // Inicia exactamente donde termina la Fase 1
        );
      });

      return () => smoother.kill();
    },
    { scope: wrapperRef, dependencies: [isFigmaMode] }
  );

  return (
    <div
      id="smooth-wrapper"
      ref={wrapperRef}
      className={isFigmaMode ? 'relative w-full min-h-screen overflow-visible' : 'smooth-wrapper'}
    >
      <div
        id="smooth-content"
        style={{
          minHeight: contentHeight > 0 ? `${contentHeight + 640}px` : undefined,
        }}
        className={
          isFigmaMode
            ? 'relative w-full min-h-screen flex flex-col bg-transparent overflow-visible'
            : 'smooth-content relative w-full min-h-screen flex flex-col bg-transparent overflow-x-clip'
        }
      >
        {/* ============================================================== */}
        {/* 1. SECCIÓN CIELO: LAS 5 FRANJAS (Exactamente 100vh / 100svh)  */}
        {/*    - Se comprime hasta el ancho mínimo de iPad (768px).       */}
        {/* ============================================================== */}
        <div
          ref={skyRef}
          className="relative w-full h-[100svh] md:h-screen pointer-events-none z-0 overflow-hidden select-none shrink-0"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full min-w-[768px] h-full flex flex-col pointer-events-none select-none">
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 bg-[#073B4C]" />
              <div className="flex-1 bg-[#094559]" />
              <div className="flex-1 bg-[#0D5167]" />
              <div className="flex-1 bg-[#105E76]" />
              <div className="flex-1 bg-[#146A85]" />
            </div>

            <div className="absolute inset-0">
              {stars.map((star) => (
                <div
                  key={star.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: star.top, left: star.left }}
                >
                  <PixelStarRenderer star={star} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. SECCIÓN HORIZONTE: SE RENDERIZA INMEDIATAMENTE DESPUÉS DE   */}
        {/*    LAS 5 FRANJAS (a la altura de 100vh) y por debajo de la UI. */}
        {/*    - Sin huecos intermedios ni franja 6.                      */}
        {/*    - z-0 permite que los elementos de UI (z-10) floten encima. */}
        {/* ============================================================== */}
        <section
          ref={horizonSectionRef}
          className="horizon-section relative z-0 w-full h-[100svh] md:h-screen select-none shrink-0 pointer-events-none"
          aria-hidden="true"
        >
          {/* Capas 1 a 4 del horizonte */}
          {HORIZON_LAYERS.map((layer) => (
            <div
              key={layer.id}
              data-layer={layer.id}
              className="horizon-layer absolute inset-0 w-full h-full pointer-events-none select-none will-change-transform overflow-hidden"
              style={{
                zIndex: layer.zIndex,
                backgroundImage: isFigmaMode ? undefined : `url('${layer.src}')`,
                backgroundRepeat: isFigmaMode ? undefined : 'repeat-x',
                backgroundPosition: isFigmaMode ? undefined : 'center bottom',
                backgroundSize: isFigmaMode ? undefined : 'auto 100%',
                imageRendering: 'pixelated',
                transform: !isFigmaMode && layer.distanceRem ? `translateY(${layer.distanceRem}rem)` : 'translateY(0)',
              }}
            >
              {isFigmaMode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={layer.src}
                  alt={layer.id}
                  className="w-full h-full object-cover object-bottom pointer-events-none select-none"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>
          ))}
        </section>

        {/* ============================================================== */}
        {/* 3. FOOTER TEMPORAL                                             */}
        {/* ============================================================== */}
        <div className="relative z-20 w-full h-[40rem] bg-[#E63946] border-t-4 border-black flex flex-col items-center justify-center text-white font-mono p-8 text-center select-none">
          <div className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-3">
            [FOOTER TEMPORAL - 40 REM]
          </div>
          <p className="text-base md:text-lg text-white/90 max-w-lg font-bold">
            ✓ Colisión en el límite inferior de Layer 1. Las capas 2 a 4 suben pasando por detrás.
          </p>
        </div>

        {/* ============================================================== */}
        {/* 4. CAPA DE LA UI (Foreground): Sobre las 5 franjas y sobre el   */}
        {/*    horizonte, permitiendo interacción completa en sus botones.  */}
        {/* ============================================================== */}
        <div
          ref={contentRef}
          className="absolute top-0 left-0 right-0 z-10 w-full pointer-events-none"
        >
          <div className="pointer-events-auto w-full flex flex-col">
            {children}
          </div>
        </div>

      {/* Animaciones pixeladas de estrellas */}
      <style jsx global>{`
        @keyframes pixelStarNormalState {
          0%, 49.99% {
            opacity: 1;
            visibility: visible;
          }
          50%, 100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes pixelStarGrownState {
          0%, 49.99% {
            opacity: 0;
            visibility: hidden;
          }
          50%, 100% {
            opacity: 1;
            visibility: visible;
          }
        }

        .anim-star-normal {
          animation: pixelStarNormalState 3s steps(1, end) infinite;
        }

        .anim-star-grown {
          animation: pixelStarGrownState 3s steps(1, end) infinite;
        }
      `}</style>
      </div>
    </div>
  );
}

// Renderizador pixel-perfect de cada tipo de estrella en SVG con crispEdges (Color uniforme original)
function PixelStarRenderer({ star }: { star: StarConfig }) {
  const { color, type, delay } = star;
  const p = 6; // Tamaño de cada pixel virtual en pantalla (6px)

  if (type === 'dot-to-cross') {
    // Tipo: Punto que se convierte en cruz pequeña al crecer
    return (
      <div className="relative" style={{ width: p * 3, height: p * 3 }}>
        {/* Estado Normal: 1 Solo Pixel centrado */}
        <svg
          width={p * 3}
          height={p * 3}
          viewBox={`0 0 ${p * 3} ${p * 3}`}
          className="absolute inset-0 anim-star-normal"
          style={{ animationDelay: delay, shapeRendering: 'crispEdges' }}
        >
          <rect x={p} y={p} width={p} height={p} fill={color} />
        </svg>

        {/* Estado Crecido: Se convierte en estrella cruz de 3x3 */}
        <svg
          width={p * 3}
          height={p * 3}
          viewBox={`0 0 ${p * 3} ${p * 3}`}
          className="absolute inset-0 anim-star-grown"
          style={{ animationDelay: delay, shapeRendering: 'crispEdges' }}
        >
          <rect x={p} y={p} width={p} height={p} fill={color} />
          <rect x={p} y={0} width={p} height={p} fill={color} />
          <rect x={p} y={p * 2} width={p} height={p} fill={color} />
          <rect x={0} y={p} width={p} height={p} fill={color} />
          <rect x={p * 2} y={p} width={p} height={p} fill={color} />
        </svg>
      </div>
    );
  }

  if (type === 'cross-vertical') {
    // Tipo: Cruz que destella creciendo 1 pixel verticalmente
    return (
      <div className="relative" style={{ width: p * 3, height: p * 5 }}>
        {/* Estado Normal: Cruz simétrica centrada */}
        <svg
          width={p * 3}
          height={p * 5}
          viewBox={`0 0 ${p * 3} ${p * 5}`}
          className="absolute inset-0 anim-star-normal"
          style={{ animationDelay: delay, shapeRendering: 'crispEdges' }}
        >
          <rect x={p} y={p * 2} width={p} height={p} fill={color} />
          <rect x={p} y={p} width={p} height={p} fill={color} />
          <rect x={p} y={p * 3} width={p} height={p} fill={color} />
          <rect x={0} y={p * 2} width={p} height={p} fill={color} />
          <rect x={p * 2} y={p * 2} width={p} height={p} fill={color} />
        </svg>

        {/* Estado Crecido: Destello vertical (+1 pixel arriba y abajo) */}
        <svg
          width={p * 3}
          height={p * 5}
          viewBox={`0 0 ${p * 3} ${p * 5}`}
          className="absolute inset-0 anim-star-grown"
          style={{ animationDelay: delay, shapeRendering: 'crispEdges' }}
        >
          <rect x={p} y={p * 2} width={p} height={p} fill={color} />
          <rect x={0} y={p * 2} width={p} height={p} fill={color} />
          <rect x={p * 2} y={p * 2} width={p} height={p} fill={color} />
          <rect x={p} y={0} width={p} height={p} fill={color} />
          <rect x={p} y={p} width={p} height={p} fill={color} />
          <rect x={p} y={p * 3} width={p} height={p} fill={color} />
          <rect x={p} y={p * 4} width={p} height={p} fill={color} />
        </svg>
      </div>
    );
  }

  // Tipo: cross-horizontal (Cruz que destella creciendo 1 pixel horizontalmente)
  return (
    <div className="relative" style={{ width: p * 5, height: p * 3 }}>
      {/* Estado Normal: Cruz simétrica */}
      <svg
        width={p * 5}
        height={p * 3}
        viewBox={`0 0 ${p * 5} ${p * 3}`}
        className="absolute inset-0 anim-star-normal"
        style={{ animationDelay: delay, shapeRendering: 'crispEdges' }}
      >
        <rect x={p * 2} y={p} width={p} height={p} fill={color} />
        <rect x={p * 2} y={0} width={p} height={p} fill={color} />
        <rect x={p * 2} y={p * 2} width={p} height={p} fill={color} />
        <rect x={p} y={p} width={p} height={p} fill={color} />
        <rect x={p * 3} y={p} width={p} height={p} fill={color} />
      </svg>

      {/* Estado Crecido: Destello horizontal (+1 pixel a los lados) */}
      <svg
        width={p * 5}
        height={p * 3}
        viewBox={`0 0 ${p * 5} ${p * 3}`}
        className="absolute inset-0 anim-star-grown"
        style={{ animationDelay: delay, shapeRendering: 'crispEdges' }}
      >
        <rect x={p * 2} y={p} width={p} height={p} fill={color} />
        <rect x={p * 2} y={0} width={p} height={p} fill={color} />
        <rect x={p * 2} y={p * 2} width={p} height={p} fill={color} />
        <rect x={0} y={p} width={p} height={p} fill={color} />
        <rect x={p} y={p} width={p} height={p} fill={color} />
        <rect x={p * 3} y={p} width={p} height={p} fill={color} />
        <rect x={p * 4} y={p} width={p} height={p} fill={color} />
      </svg>
    </div>
  );
}
