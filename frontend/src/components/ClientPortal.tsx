'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ClientPortalProps {
  children: ReactNode;
}

/**
 * Renderiza elementos fuera del DOM actual (directamente en document.body),
 * garantizando que elementos 'fixed' (como modales, drawers y la barra móvil)
 * no se vean afectados por el contexto de 'transform' de GSAP ScrollSmoother.
 */
export default function ClientPortal({ children }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
