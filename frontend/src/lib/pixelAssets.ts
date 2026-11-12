import type { KAPLAYCtx, LoadSpriteOpt, SpriteAnims } from 'kaplay';

/**
 * ============================================================================
 * 1. JERARQUÍA DE CAPAS — PATRÓN LAYERED STAGE (Escena por Capas)
 * ============================================================================
 * Define el orden estricto de renderizado en el canvas 2D de KAPLAY:
 * 1. `bg`     -> Capas de fondo y parallax horizontal (cielo, pasillos lejanos)
 * 2. `tiles`  -> Suelo, plataformas, zócalos y muros base del nivel
 * 3. `props`  -> Estaciones/puertas de laboratorios, escritorios, racks, luces
 * 4. `actors` -> Personaje controlable y entidades móviles con colisión
 * 5. `fx`     -> Partículas, cursores e indicadores flotantes en el escenario
 */
export const STAGE_LAYERS = ['bg', 'tiles', 'props', 'actors', 'fx'] as const;

export type StageLayerName = (typeof STAGE_LAYERS)[number];

export const STAGE_DEFAULT_LAYER: StageLayerName = 'actors';

export const STAGE_LAYER_Z: Record<StageLayerName, number> = {
  bg: 10,
  tiles: 100,
  props: 200,
  actors: 300,
  fx: 400,
};

/**
 * Paleta oficial Pixel-Neobrutalista / Retro OS para respaldos procedurales y efectos en Canvas
 */
export const STAGE_RETRO_PALETTE = {
  navyDark: '#073B4C',
  skyDeep: '#0B4F6C',
  skyMid: '#146985',
  skyHorizon: '#1C84A5',
  creamLight: '#FFFAEB',
  goldHighlight: '#FFD166',
  ctaGreen: '#06D6A0',
  yellowBody: '#ffdf88',
  yellowHeader: '#ffb220',
  yellowBorder: '#dd6902',
  blueBody: '#bae6fd',
  blueHeader: '#38bdf8',
  blueBorder: '#0284c7',
  redBody: '#fecdd3',
  redHeader: '#fb7185',
  redBorder: '#e11d48',
} as const;

/**
 * ============================================================================
 * 2. INTERFACES TIPADAS DEL MANIFIESTO DE ASSETS 2D
 * ============================================================================
 */

export interface BackgroundLayer {
  /** Identificador único del sprite en KAPLAY (ej. 'bg-campus-far') */
  id: string;
  /** Ruta pública dentro de /assets/pixel/backgrounds/ */
  src: string;
  /** Factor de velocidad horizontal respecto a la cámara (0.0 = estático, 1.0 = pegado al suelo) */
  parallaxFactor: number;
  /** Ancho base de la textura en píxeles */
  width: number;
  /** Alto base de la textura en píxeles */
  height: number;
  /** Desplazamiento vertical opcional en el escenario */
  offsetY?: number;
  /** Si la capa debe repetirse horizontalmente (tiling) a lo largo del escenario */
  repeatX?: boolean;
  /** Sub-índice Z dentro de la capa `bg` */
  zOffset?: number;
  /** Color de respaldo si el archivo aún no ha sido subido a /public/assets/pixel/backgrounds/ */
  fallbackColor: string;
  /** Activar en `true` cuando el archivo exista en `/public/assets/pixel/backgrounds/` */
  enabled: boolean;
}

export interface TilesetConfig {
  /** Identificador único del tileset en KAPLAY (ej. 'tile-corridor-floor') */
  id: string;
  /** Ruta pública dentro de /assets/pixel/tilesets/ */
  src: string;
  /** Ancho de cada mosaico individual en píxeles (ej. 32) */
  tileWidth: number;
  /** Alto de cada mosaico individual en píxeles (ej. 32) */
  tileHeight: number;
  /** Columnas en la hoja de tiles (para spritesheets) */
  sliceX?: number;
  /** Filas en la hoja de tiles (para spritesheets) */
  sliceY?: number;
  /** Colores de respaldo para el bloque de suelo procedural */
  fallbackColors: {
    topTrim: string;
    body: string;
    border: string;
    gridLine: string;
  };
  /** Activar en `true` cuando el archivo exista en `/public/assets/pixel/tilesets/` */
  enabled: boolean;
}

export interface CharacterSpriteConfig {
  /** Identificador único del personaje en KAPLAY (ej. 'char-student') */
  id: string;
  /** Ruta pública dentro de /assets/pixel/characters/ */
  src: string;
  /** Ancho del collider/frame del personaje en píxeles */
  width: number;
  /** Alto del collider/frame del personaje en píxeles */
  height: number;
  /** Columnas de frames en el spritesheet */
  sliceX?: number;
  /** Filas de frames en el spritesheet */
  sliceY?: number;
  /** Definición de animaciones por frames (idle, walk, interact, jump) */
  anims?: SpriteAnims;
  /** Velocidad de desplazamiento horizontal en píxeles/segundo */
  speed: number;
  /** Fuerza de salto opcional en píxeles/segundo */
  jumpForce?: number;
  /** Paleta de respaldo para dibujar al avatar pixel art cuando `enabled` es `false` */
  fallbackPalette: {
    suit: string;
    visor: string;
    outline: string;
    accent: string;
  };
  /** Activar en `true` cuando el archivo exista en `/public/assets/pixel/characters/` */
  enabled: boolean;
}

export type StagePropCategory =
  | 'lab-door'
  | 'study-door'
  | 'auditorium-door'
  | 'computer-desk'
  | 'server-rack'
  | 'status-beacon'
  | 'signboard'
  | 'decoration';

export interface StagePropConfig {
  /** Identificador único del prop en KAPLAY (ej. 'prop-door-lab') */
  id: string;
  /** Ruta pública dentro de /assets/pixel/props/ */
  src: string;
  /** Categoría semántica del objeto dentro del campus */
  category: StagePropCategory;
  /** Ancho base en píxeles */
  width: number;
  /** Alto base en píxeles */
  height: number;
  /** Columnas si es un prop animado (ej. puerta abriéndose o servidor parpadeando) */
  sliceX?: number;
  /** Filas si es un prop animado */
  sliceY?: number;
  /** Animaciones opcionales del objeto */
  anims?: SpriteAnims;
  /** Si tiene área de colisión (`area()`) para detectar proximidad del personaje */
  hasCollision: boolean;
  /** Si el usuario puede interactuar (`Enter` / Click) con este objeto */
  isInteractive: boolean;
  /** Colores del tema Retro OS de respaldo (Amarillo, Azul o Rojo) */
  fallbackTheme: {
    body: string;
    header: string;
    border: string;
    badgeBg: string;
  };
  /** Activar en `true` cuando el archivo exista en `/public/assets/pixel/props/` */
  enabled: boolean;
}

export interface StageUIAssetConfig {
  /** Identificador único del icono/indicador en KAPLAY (ej. 'ui-prompt-enter') */
  id: string;
  /** Ruta pública dentro de /assets/pixel/ui/ */
  src: string;
  /** Ancho en píxeles */
  width: number;
  /** Alto en píxeles */
  height: number;
  /** Activar en `true` cuando el archivo exista en `/public/assets/pixel/ui/` */
  enabled: boolean;
}

export interface PixelStageManifest {
  backgrounds: BackgroundLayer[];
  tilesets: Record<string, TilesetConfig>;
  characters: Record<string, CharacterSpriteConfig>;
  props: Record<string, StagePropConfig>;
  ui: Record<string, StageUIAssetConfig>;
}

/**
 * ============================================================================
 * 3. REGISTRO CENTRALIZADO DE RECURSOS (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * Para usar tus propios archivos .png o .svg:
 * 1. Copia el archivo en la subcarpeta correspondiente dentro de `/frontend/public/assets/pixel/`.
 * 2. Verifica la ruta `src` aquí abajo y cambia `enabled: true`.
 */
export const PIXEL_STAGE_MANIFEST: PixelStageManifest = {
  backgrounds: [
    {
      id: 'horizon-bg-layer1',
      src: '/assets/pixel/backgrounds/horizon_bg_layer1.svg',
      parallaxFactor: 0.08,
      width: 320,
      height: 320,
      offsetY: 0,
      repeatX: false,
      zOffset: 1,
      fallbackColor: '#187795',
      enabled: true,
    },
    {
      id: 'horizon-bg-layer2',
      src: '/assets/pixel/backgrounds/horizon_bg_layer2.svg',
      parallaxFactor: 0.18,
      width: 320,
      height: 320,
      offsetY: 0,
      repeatX: false,
      zOffset: 2,
      fallbackColor: '#FFFAEB',
      enabled: true,
    },
    {
      id: 'horizon-bg-layer3',
      src: '/assets/pixel/backgrounds/horizon_bg_layer3.svg',
      parallaxFactor: 0.32,
      width: 320,
      height: 320,
      offsetY: 0,
      repeatX: false,
      zOffset: 3,
      fallbackColor: '#9B1644',
      enabled: true,
    },
    {
      id: 'horizon-bg-layer4',
      src: '/assets/pixel/backgrounds/horizon_bg_layer4.svg',
      parallaxFactor: 0.48,
      width: 320,
      height: 320,
      offsetY: 0,
      repeatX: false,
      zOffset: 4,
      fallbackColor: '#002F27',
      enabled: true,
    },
  ],

  tilesets: {
    corridorFloor: {
      id: 'tile-corridor-floor',
      src: '/assets/pixel/tilesets/tile-corridor-floor.png',
      tileWidth: 32,
      tileHeight: 48,
      sliceX: 1,
      sliceY: 1,
      fallbackColors: {
        topTrim: STAGE_RETRO_PALETTE.yellowHeader,
        body: STAGE_RETRO_PALETTE.navyDark,
        border: STAGE_RETRO_PALETTE.yellowBorder,
        gridLine: STAGE_RETRO_PALETTE.skyMid,
      },
      enabled: false,
    },
  },

  characters: {
    studentRunner: {
      id: 'char-student-runner',
      src: '/assets/pixel/characters/char-student-runner.png',
      width: 34,
      height: 50,
      sliceX: 4,
      sliceY: 1,
      anims: {
        idle: { from: 0, to: 0, loop: true, speed: 4 },
        walk: { from: 0, to: 3, loop: true, speed: 10 },
      },
      speed: 280,
      jumpForce: 460,
      fallbackPalette: {
        suit: STAGE_RETRO_PALETTE.goldHighlight,
        visor: STAGE_RETRO_PALETTE.ctaGreen,
        outline: STAGE_RETRO_PALETTE.navyDark,
        accent: STAGE_RETRO_PALETTE.creamLight,
      },
      enabled: false,
    },
  },

  props: {
    labStation: {
      id: 'prop-station-lab',
      src: '/assets/pixel/props/prop-station-lab.png',
      category: 'lab-door',
      width: 148,
      height: 164,
      hasCollision: true,
      isInteractive: true,
      fallbackTheme: {
        body: STAGE_RETRO_PALETTE.blueBody,
        header: STAGE_RETRO_PALETTE.blueHeader,
        border: STAGE_RETRO_PALETTE.blueBorder,
        badgeBg: '#e0f2fe',
      },
      enabled: false,
    },
    studyStation: {
      id: 'prop-station-study',
      src: '/assets/pixel/props/prop-station-study.png',
      category: 'study-door',
      width: 148,
      height: 164,
      hasCollision: true,
      isInteractive: true,
      fallbackTheme: {
        body: STAGE_RETRO_PALETTE.yellowBody,
        header: STAGE_RETRO_PALETTE.yellowHeader,
        border: STAGE_RETRO_PALETTE.yellowBorder,
        badgeBg: '#fef3c7',
      },
      enabled: false,
    },
    auditoriumStation: {
      id: 'prop-station-auditorium',
      src: '/assets/pixel/props/prop-station-auditorium.png',
      category: 'auditorium-door',
      width: 148,
      height: 164,
      hasCollision: true,
      isInteractive: true,
      fallbackTheme: {
        body: STAGE_RETRO_PALETTE.redBody,
        header: STAGE_RETRO_PALETTE.redHeader,
        border: STAGE_RETRO_PALETTE.redBorder,
        badgeBg: '#ffe4e6',
      },
      enabled: false,
    },
    serverRack: {
      id: 'prop-server-rack',
      src: '/assets/pixel/props/prop-server-rack.png',
      category: 'server-rack',
      width: 44,
      height: 92,
      hasCollision: false,
      isInteractive: false,
      fallbackTheme: {
        body: STAGE_RETRO_PALETTE.navyDark,
        header: STAGE_RETRO_PALETTE.skyMid,
        border: STAGE_RETRO_PALETTE.creamLight,
        badgeBg: STAGE_RETRO_PALETTE.ctaGreen,
      },
      enabled: false,
    },
  },

  ui: {
    promptEnter: {
      id: 'ui-prompt-enter',
      src: '/assets/pixel/ui/ui-prompt-enter.svg',
      width: 64,
      height: 24,
      enabled: false,
    },
  },
};

/**
 * Construye las opciones de `k.loadSprite` a partir de la configuración de un asset
 */
function buildSpriteLoadOpt(cfg: {
  sliceX?: number;
  sliceY?: number;
  anims?: SpriteAnims;
}): LoadSpriteOpt | undefined {
  if (!cfg.sliceX && !cfg.sliceY && !cfg.anims) {
    return undefined;
  }
  return {
    sliceX: cfg.sliceX ?? 1,
    sliceY: cfg.sliceY ?? 1,
    anims: cfg.anims,
  };
}

/**
 * Inicializa las 5 capas del patrón Layered Stage y carga todos los sprites habilitados
 * en el manifiesto dentro de la instancia activa de KAPLAY.
 *
 * @param k Instancia de contexto KAPLAY (`KAPLAYCtx`)
 * @param manifest Manifiesto opcional (por defecto `PIXEL_STAGE_MANIFEST`)
 * @returns Conjunto con los `id` de todos los sprites registrados para carga
 */
export function loadStageAssets(
  k: KAPLAYCtx,
  manifest: PixelStageManifest = PIXEL_STAGE_MANIFEST
): Set<string> {
  // 1. Configurar la jerarquía de capas del escenario (Layered Stage)
  k.setLayers([...STAGE_LAYERS], STAGE_DEFAULT_LAYER);

  const registeredSprites = new Set<string>();

  // 2. Cargar capas de fondo (backgrounds) habilitadas
  for (const bg of manifest.backgrounds) {
    if (bg.enabled && bg.src) {
      k.loadSprite(bg.id, bg.src);
      registeredSprites.add(bg.id);
    }
  }

  // 3. Cargar tilesets habilitados
  for (const tile of Object.values(manifest.tilesets)) {
    if (tile.enabled && tile.src) {
      k.loadSprite(tile.id, tile.src, buildSpriteLoadOpt(tile));
      registeredSprites.add(tile.id);
    }
  }

  // 4. Cargar sprites/spritesheets de personajes habilitados
  for (const charCfg of Object.values(manifest.characters)) {
    if (charCfg.enabled && charCfg.src) {
      k.loadSprite(charCfg.id, charCfg.src, buildSpriteLoadOpt(charCfg));
      registeredSprites.add(charCfg.id);
    }
  }

  // 5. Cargar props/objetos del escenario habilitados
  for (const propCfg of Object.values(manifest.props)) {
    if (propCfg.enabled && propCfg.src) {
      k.loadSprite(propCfg.id, propCfg.src, buildSpriteLoadOpt(propCfg));
      registeredSprites.add(propCfg.id);
    }
  }

  // 6. Cargar indicadores UI flotantes habilitados
  for (const uiCfg of Object.values(manifest.ui)) {
    if (uiCfg.enabled && uiCfg.src) {
      k.loadSprite(uiCfg.id, uiCfg.src);
      registeredSprites.add(uiCfg.id);
    }
  }

  return registeredSprites;
}

/**
 * Resuelve la configuración de estación (`StagePropConfig`) según el tipo o índice de la sala
 */
export function getStationPropForRoom(
  roomTypeOrName: string,
  index: number,
  manifest: PixelStageManifest = PIXEL_STAGE_MANIFEST
): StagePropConfig {
  const normalized = roomTypeOrName.toLowerCase();
  if (normalized.includes('auditorio') || normalized.includes('conferencia')) {
    return manifest.props.auditoriumStation;
  }
  if (normalized.includes('estudio') || normalized.includes('lectura')) {
    return manifest.props.studyStation;
  }
  if (normalized.includes('lab') || normalized.includes('cómputo') || normalized.includes('computo')) {
    return manifest.props.labStation;
  }
  const cycle = [
    manifest.props.labStation,
    manifest.props.studyStation,
    manifest.props.auditoriumStation,
  ];
  return cycle[index % cycle.length];
}
