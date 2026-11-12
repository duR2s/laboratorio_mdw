'use client';

import { useState, useEffect, useCallback } from 'react';

const MUTE_STORAGE_KEY = 'labreserva_retro_audio_muted';
const MUTE_CHANGE_EVENT = 'labreserva:audio-mute-change';

// Singleton AudioContext y retención de nodos para evitar cortes por Garbage Collection
let sharedAudioCtx: AudioContext | null = null;
let autoUnlockBound = false;
let lastAutoUnlockTimeMs = 0;
const activeNodes = new Set<AudioNode>();

// Slot único para el último sonido solicitado mientras el AudioContext termina de despertar
let pendingSoundCallback: ((ctx: AudioContext) => void) | null = null;
let pendingSoundTimestampMs = 0;
let resumeInFlight = false;

// Canal monofónico para el cursor (evita que dos blips de movimiento se encimen)
let currentMoveOsc: OscillatorNode | null = null;
let currentMoveGain: GainNode | null = null;
let lastMoveTimeMs = 0;
const MOVE_COOLDOWN_MS = 65;

/**
 * Lee directamente desde localStorage si el audio está silenciado
 */
export function getIsMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Guarda el estado de mute en localStorage y notifica a todos los componentes suscritos
 */
export function setIsMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent<boolean>(MUTE_CHANGE_EVENT, { detail: muted }));
  } catch {
    // Ignorar errores en modo privado restringido
  }
}

/**
 * Despierta el pipeline de hardware de Web Audio reproduciendo un buffer silencioso de 1 sample
 */
function warmUpHardware(ctx: AudioContext): void {
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignorar si aún no está permitido
  }
}

/**
 * Ejecuta el sonido pendiente tan pronto el AudioContext entra en estado 'running'
 */
function flushPendingSound(ctx: AudioContext): void {
  if (ctx.state !== 'running' || getIsMuted() || !pendingSoundCallback) return;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const cb = pendingSoundCallback;
  const elapsed = nowMs - pendingSoundTimestampMs;
  pendingSoundCallback = null;

  // Permitimos hasta 600ms para que el driver de audio del SO (PulseAudio/PipeWire/CoreAudio) abra el stream tras recargar
  if (elapsed <= 600) {
    cb(ctx);
  }
}

/**
 * Alterna el estado de mute en localStorage y reproduce confirmación sonora al activar
 */
export function toggleMute(): boolean {
  const currentlyMuted = getIsMuted();
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const ctx = getAudioContext();

  // Si no estaba muteado en localStorage pero el navegador tenía bloqueado/suspendido el AudioContext
  // tras hacer Refresh (o el pointerdown de este mismo clic lo acaba de desbloquear hace < 350ms),
  // este clic activa/despierta el audio en vez de silenciar la página por error.
  if (
    !currentlyMuted &&
    ctx &&
    (ctx.state !== 'running' || (lastAutoUnlockTimeMs > 0 && nowMs - lastAutoUnlockTimeMs < 350))
  ) {
    lastAutoUnlockTimeMs = 0;
    warmUpHardware(ctx);
    ctx
      .resume()
      .then(() => {
        lastMoveTimeMs = 0;
        playMenuMove();
      })
      .catch(() => {});
    setIsMuted(false);
    return false;
  }

  const nextMuted = !currentlyMuted;
  setIsMuted(nextMuted);
  if (!nextMuted) {
    lastMoveTimeMs = 0;
    if (ctx) {
      warmUpHardware(ctx);
    }
    playMenuMove();
  }
  return nextMuted;
}

/**
 * Obtiene o inicializa la instancia única de AudioContext
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtxClass) return null;

    try {
      sharedAudioCtx = new AudioCtxClass();
      sharedAudioCtx.onstatechange = () => {
        if (sharedAudioCtx && sharedAudioCtx.state === 'running') {
          flushPendingSound(sharedAudioCtx);
        }
      };
    } catch {
      return null;
    }
  }

  bindAutoUnlockListeners();
  return sharedAudioCtx;
}

/**
 * Desbloquea el AudioContext en el primer evento tras recargar la página
 */
function bindAutoUnlockListeners(): void {
  if (autoUnlockBound || typeof window === 'undefined') return;
  autoUnlockBound = true;

  let lastMoveAttemptMs = 0;

  const unlockOnGesture = () => {
    if (getIsMuted()) return;
    const ctx = sharedAudioCtx || getAudioContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      lastAutoUnlockTimeMs = nowMs;
      warmUpHardware(ctx);
      ctx
        .resume()
        .then(() => {
          flushPendingSound(ctx);
        })
        .catch(() => {});
    }
  };

  // Intento ligero en movimiento/scroll/foco por si el navegador ya concedió Media Engagement o tras F5
  const unlockOnPassiveActivity = () => {
    if (getIsMuted()) return;
    if (sharedAudioCtx && sharedAudioCtx.state === 'running') return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - lastMoveAttemptMs < 300) return;
    lastMoveAttemptMs = nowMs;

    const ctx = sharedAudioCtx || getAudioContext();
    if (ctx && ctx.state !== 'running') {
      ctx
        .resume()
        .then(() => {
          flushPendingSound(ctx);
        })
        .catch(() => {});
    }
  };

  const gestureEvents = [
    'pointerdown',
    'mousedown',
    'mouseup',
    'click',
    'keydown',
    'keyup',
    'touchstart',
    'touchend',
  ];

  gestureEvents.forEach((evt) => {
    window.addEventListener(evt, unlockOnGesture, { capture: true, passive: true });
  });

  const passiveEvents = ['pointermove', 'mousemove', 'wheel', 'focus', 'pageshow'];
  passiveEvents.forEach((evt) => {
    window.addEventListener(evt, unlockOnPassiveActivity, { capture: true, passive: true });
  });
}

if (typeof window !== 'undefined') {
  bindAutoUnlockListeners();
  // Pre-inicializar AudioContext al cargar el módulo si el audio está en ON
  if (!getIsMuted()) {
    const initialCtx = getAudioContext();
    if (initialCtx && initialCtx.state !== 'running') {
      initialCtx.resume().catch(() => {});
    }
  }
}

/**
 * Ejecuta la síntesis inmediatamente si el AudioContext está 'running',
 * o guarda el sonido en el slot único pendiente mientras el AudioContext despierta.
 */
function withRunningContext(callback: (ctx: AudioContext) => void): void {
  if (getIsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'running') {
    pendingSoundCallback = null;
    callback(ctx);
    return;
  }

  // Guardar únicamente el último sonido solicitado (nunca acumular cola de hovers)
  pendingSoundCallback = callback;
  pendingSoundTimestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!resumeInFlight) {
    resumeInFlight = true;
    ctx
      .resume()
      .then(() => {
        resumeInFlight = false;
        flushPendingSound(ctx);
      })
      .catch(() => {
        resumeInFlight = false;
      });
  }
}

/**
 * Mantiene referencia viva de los nodos de audio hasta que finalice la reproducción
 */
function retainNodes(osc: OscillatorNode, nodes: AudioNode[]): void {
  nodes.forEach((n) => activeNodes.add(n));
  osc.onended = () => {
    nodes.forEach((n) => {
      try {
        n.disconnect();
      } catch {
        // Ya desconectado
      }
      activeNodes.delete(n);
    });
  };
}

/**
 * 1. playMenuMove() — Cursor / Hover / Desplegar Menús y Pickers (Fiel a SMB3 Map/Menu Cursor, NES 2A03)
 * - Onda: square (Pulse 1 monofónico)
 * - Progresión rápida por frames de 60Hz (16.6ms): D5 (587.33 Hz) -> G5 (783.99 Hz) -> D6 (1174.66 Hz)
 */
export function playMenuMove(): void {
  if (getIsMuted()) return;

  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastMoveTimeMs < MOVE_COOLDOWN_MS) {
    return;
  }
  lastMoveTimeMs = nowMs;

  withRunningContext((ctx) => {
    try {
      const now = ctx.currentTime;

      if (currentMoveOsc && currentMoveGain) {
        try {
          currentMoveGain.gain.cancelScheduledValues(now);
          currentMoveGain.gain.setValueAtTime(0.0001, now);
          currentMoveOsc.stop(now + 0.002);
        } catch {
          // Ignorar si ya había terminado
        }
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      currentMoveOsc = osc;
      currentMoveGain = gain;

      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(783.99, now + 0.015); // G5
      osc.frequency.setValueAtTime(1174.66, now + 0.03); // D6

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.002);
      gain.gain.setValueAtTime(0.08, now + 0.032);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      retainNodes(osc, [osc, gain]);
      osc.start(now);
      osc.stop(now + 0.052);
    } catch {
      // Silenciar
    }
  });
}

/**
 * 2. playMenuSelect() — Sonido de Moneda (Exclusivo para botones de acción / confirmación, NO navegación)
 * - Onda: square filtrada (NES 2A03 Pulse)
 * - Notas: B5 (987.77 Hz) por 80ms -> E6 (1318.51 Hz) por ~560ms con decay lineal-suave
 */
export function playMenuSelect(): void {
  withRunningContext((ctx) => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(5400, now);
      filter.frequency.linearRampToValueAtTime(3200, now + 0.64);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.095, now + 0.004);
      gain.gain.setValueAtTime(0.095, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.085, now + 0.22);
      gain.gain.linearRampToValueAtTime(0.042, now + 0.42);
      gain.gain.linearRampToValueAtTime(0.014, now + 0.54);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      retainNodes(osc, [osc, filter, gain]);
      osc.start(now);
      osc.stop(now + 0.66);
    } catch {
      // Silenciar
    }
  });
}

/**
 * 3. playPauseSound() / playMenuOpen() — Sonido Clásico de Pausa NES (Para cambio de página y navegación)
 * - Secuencia auténtica de 4 notas alternadas: E6 (1318.51 Hz) -> C6 (1046.50 Hz) -> E6 (1318.51 Hz) -> C6 (1046.50 Hz)
 */
export function playPauseSound(): void {
  withRunningContext((ctx) => {
    try {
      const now = ctx.currentTime;
      const step = 0.066; // 4 frames a 60Hz (~66ms)
      const totalDuration = step * 3 + 0.18;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1318.51, now); // E6
      osc.frequency.setValueAtTime(1046.5, now + step); // C6
      osc.frequency.setValueAtTime(1318.51, now + step * 2); // E6
      osc.frequency.setValueAtTime(1046.5, now + step * 3); // C6

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(5200, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.003);
      gain.gain.setValueAtTime(0.09, now + step * 3 + 0.04);
      gain.gain.linearRampToValueAtTime(0.035, now + totalDuration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      retainNodes(osc, [osc, filter, gain]);
      osc.start(now);
      osc.stop(now + totalDuration + 0.01);
    } catch {
      // Silenciar
    }
  });
}

export const playMenuOpen = playPauseSound;

/**
 * 4. playErrorBump() — Sonido de Error / Colisión 409 / Cerrar Ventana Emergente (Fiel al "Bump" de SMB3)
 * - Onda: triangle + escalones discretos de registro NES 2A03 (185 Hz -> 138.59 Hz -> 103.83 Hz -> 73.42 Hz)
 */
export function playErrorBump(): void {
  withRunningContext((ctx) => {
    try {
      const now = ctx.currentTime;
      const duration = 0.145;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185.0, now);
      osc.frequency.setValueAtTime(138.59, now + 0.032);
      osc.frequency.setValueAtTime(103.83, now + 0.068);
      osc.frequency.setValueAtTime(73.42, now + 0.105);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.13, now + 0.004);
      gain.gain.setValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      retainNodes(osc, [osc, gain]);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Silenciar
    }
  });
}

/**
 * Hook Reactivo libre de Hydration Mismatch:
 * 1) Render inicial (SSR + Hydration) consistente.
 * 2) En useEffect (inmediatamente tras hidratar en cliente) lee localStorage y sincroniza el estado real.
 */
export function useRetroAudio() {
  const [isMuted, setIsMutedState] = useState<boolean>(false);

  useEffect(() => {
    // 1. Leer el estado real guardado en localStorage inmediatamente al montar en cliente
    const muted = getIsMuted();
    setIsMutedState(muted);

    if (!muted) {
      const ctx = getAudioContext();
      if (ctx && ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
    }

    // 2. Escuchar cambios desde cualquier instancia del botón o pestaña
    const handleCustomChange = (e: Event) => {
      const customEvt = e as CustomEvent<boolean>;
      setIsMutedState(Boolean(customEvt.detail));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MUTE_STORAGE_KEY) {
        setIsMutedState(e.newValue === 'true');
      }
    };

    window.addEventListener(MUTE_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(MUTE_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = toggleMute();
    setIsMutedState(next);
  }, []);

  return {
    isMuted,
    toggleMute: handleToggleMute,
    playMenuMove,
    playMenuSelect,
    playPauseSound,
    playMenuOpen,
    playErrorBump,
  };
}
