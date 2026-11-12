'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import kaplay, { type KAPLAYCtx, type GameObj } from 'kaplay';
import type { Sala } from '@/types';
import {
  PIXEL_STAGE_MANIFEST,
  STAGE_LAYER_Z,
  STAGE_RETRO_PALETTE,
  loadStageAssets,
  getStationPropForRoom,
} from '@/lib/pixelAssets';
import { playMenuMove, playMenuSelect } from '@/lib/retroAudio';
import PixelIcon from '@/components/PixelIcon';

export interface PixelStageCanvasProps {
  /** Lista de salas/laboratorios a renderizar como estaciones en el escenario 2D */
  rooms?: Sala[];
  /** ID de la sala seleccionada externamente desde React (mueve al personaje hacia esa puerta) */
  selectedRoomId?: number | null;
  /** Callback disparado cuando el personaje entra o sale del área de una estación */
  onHoverRoom?: (room: Sala | null) => void;
  /** Callback disparado al confirmar/interactuar con una estación (Enter, Espacio o botón CTA) */
  onSelectRoom?: (room: Sala) => void;
  /** Altura del viewport del canvas en píxeles (por defecto 340) */
  height?: number;
  /** Mostrar barra HUD Neobrutalista integrada sobre el escenario */
  showHud?: boolean;
  /** Clases adicionales para el contenedor raíz */
  className?: string;
}

const DEFAULT_DEMO_ROOMS: Sala[] = [
  {
    id: 1,
    nombre: 'Lab Cómputo A',
    capacidad: 25,
    ubicacion: 'Edificio Norte - Piso 1',
    version: 1,
  },
  {
    id: 2,
    nombre: 'Lab Redes & Cisco',
    capacidad: 20,
    ubicacion: 'Edificio Norte - Piso 2',
    version: 3,
  },
  {
    id: 3,
    nombre: 'Sala Estudio Grupal B',
    capacidad: 8,
    ubicacion: 'Biblioteca Central',
    version: 2,
  },
  {
    id: 4,
    nombre: 'Auditorio Innovación',
    capacidad: 60,
    ubicacion: 'Pabellón Tecnológico',
    version: 1,
  },
];

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 340;
const FLOOR_HEIGHT = 56;
const FLOOR_Y = STAGE_HEIGHT - FLOOR_HEIGHT;
const STATION_SPACING = 260;
const STAGE_PADDING_X = 200;

export default function PixelStageCanvas({
  rooms = DEFAULT_DEMO_ROOMS,
  selectedRoomId = null,
  onHoverRoom,
  onSelectRoom,
  height = STAGE_HEIGHT,
  showHud = true,
  className = '',
}: PixelStageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const kaplayRef = useRef<KAPLAYCtx | null>(null);

  // Referencia imperativa para ordenar al personaje caminar hacia una coordenada X desde la UI de React
  const walkToRoomRef = useRef<((roomId: number, triggerSelect?: boolean) => void) | null>(null);

  // Referencias estables para callbacks de React (evita reinicializar el canvas cuando cambian closures)
  const onHoverRoomRef = useRef(onHoverRoom);
  const onSelectRoomRef = useRef(onSelectRoom);

  useEffect(() => {
    onHoverRoomRef.current = onHoverRoom;
  }, [onHoverRoom]);

  useEffect(() => {
    onSelectRoomRef.current = onSelectRoom;
  }, [onSelectRoom]);

  const activeRooms = rooms.length > 0 ? rooms : DEFAULT_DEMO_ROOMS;

  const [hoveredRoom, setHoveredRoom] = useState<Sala | null>(activeRooms[0] ?? null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(
    selectedRoomId ?? activeRooms[0]?.id ?? null
  );

  // Sincronizar cuando `selectedRoomId` cambia desde el componente padre
  useEffect(() => {
    if (selectedRoomId !== null && selectedRoomId !== undefined) {
      setActiveRoomId(selectedRoomId);
      walkToRoomRef.current?.(selectedRoomId, false);
    }
  }, [selectedRoomId]);

  const handleQuickJump = useCallback((room: Sala) => {
    playMenuMove();
    setActiveRoomId(room.id);
    setHoveredRoom(room);
    walkToRoomRef.current?.(room.id, false);
  }, []);

  const handleConfirmCurrentRoom = useCallback(
    (room: Sala) => {
      playMenuSelect();
      setActiveRoomId(room.id);
      onSelectRoomRef.current?.(room);
    },
    []
  );

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    // Prevención defensiva contra doble inicialización en React 18 StrictMode / HMR
    if (kaplayRef.current) {
      try {
        kaplayRef.current.quit();
      } catch {
        // Ignorar si ya fue destruido
      }
      kaplayRef.current = null;
    }

    const k = kaplay({
      canvas: canvasEl,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      crisp: true,
      texFilter: 'nearest',
      pixelDensity: 1,
      global: false,
      debug: false,
      loadingScreen: false,
      touchToMouse: true,
      focus: false,
      background: [7, 59, 76], // #073B4C
    });

    kaplayRef.current = k;

    // 1. Registrar las 5 capas (`bg`, `tiles`, `props`, `actors`, `fx`) y cargar manifiesto
    const registeredSprites = loadStageAssets(k, PIXEL_STAGE_MANIFEST);

    const worldWidth = Math.max(
      STAGE_WIDTH,
      STAGE_PADDING_X * 2 + Math.max(0, activeRooms.length - 1) * STATION_SPACING + 160
    );

    // Mapa de coordenadas X de cada sala para navegación por teclado o salto rápido desde HUD
    const stationPositions = new Map<number, { x: number; room: Sala }>();
    activeRooms.forEach((room, idx) => {
      const stationX = STAGE_PADDING_X + idx * STATION_SPACING;
      stationPositions.set(room.id, { x: stationX, room });
    });

    k.scene('lab-selector-stage', () => {
      // ====================================================================
      // CAPA 1: `bg` — Cielo Nocturno Retro, Estrellas y Siluetas en Parallax
      // ====================================================================
      const skyBands = [
        { y: 0, h: 52, color: '#073B4C' },
        { y: 52, h: 52, color: '#0B4F6C' },
        { y: 104, h: 56, color: '#0F5C7A' },
        { y: 160, h: 62, color: '#146985' },
        { y: 222, h: 66, color: '#187795' },
      ];

      skyBands.forEach((band, idx) => {
        k.add([
          k.rect(STAGE_WIDTH + 60, band.h),
          k.pos(-30, band.y),
          k.color(k.Color.fromHex(band.color)),
          k.fixed(),
          k.layer('bg'),
          k.z(STAGE_LAYER_Z.bg + idx),
        ]);
      });

      // Estrellas pixel art con parpadeo discreto en capa `bg`
      for (let i = 0; i < 28; i++) {
        const starX = (i * 97) % STAGE_WIDTH;
        const starY = 14 + ((i * 43) % 150);
        const starSize = i % 4 === 0 ? 4 : 2;
        const isGold = i % 5 === 0;
        const star = k.add([
          k.rect(starSize, starSize),
          k.pos(starX, starY),
          k.color(
            k.Color.fromHex(
              isGold ? STAGE_RETRO_PALETTE.goldHighlight : STAGE_RETRO_PALETTE.creamLight
            )
          ),
          k.opacity(0.85),
          k.fixed(),
          k.layer('bg'),
          k.z(STAGE_LAYER_Z.bg + 6),
        ]);

        star.onUpdate(() => {
          const stepTick = Math.floor(k.time() * 2 + i) % 3;
          star.opacity = stepTick === 0 ? 0.25 : 0.9;
        });
      }

      // Pilares de pasillo lejanos con Parallax horizontal (0.35x)
      const pillarCount = Math.ceil(worldWidth / 180) + 4;
      const parallaxPillars: Array<{ obj: GameObj; baseX: number }> = [];
      for (let i = 0; i < pillarCount; i++) {
        const baseX = i * 180;
        const pillar = k.add([
          k.rect(28, 170),
          k.pos(baseX, FLOOR_Y - 170),
          k.color(k.Color.fromHex('#0B4F6C')),
          k.outline(2, k.Color.fromHex('#073B4C')),
          k.layer('bg'),
          k.z(STAGE_LAYER_Z.bg + 8),
        ]);
        parallaxPillars.push({ obj: pillar, baseX });
      }

      // ====================================================================
      // CAPA 2: `tiles` — Suelo Horizontal del Pasillo y Mosaicos Modulares
      // ====================================================================
      const floorCfg = PIXEL_STAGE_MANIFEST.tilesets.corridorFloor;

      // Franja superior amarilla de borde de plataforma (#ffb220)
      k.add([
        k.rect(worldWidth + 200, 10),
        k.pos(-100, FLOOR_Y),
        k.color(k.Color.fromHex(floorCfg.fallbackColors.topTrim)),
        k.outline(2, k.Color.fromHex(floorCfg.fallbackColors.border)),
        k.layer('tiles'),
        k.z(STAGE_LAYER_Z.tiles + 2),
      ]);

      // Cuerpo sólido del suelo (#073B4C)
      k.add([
        k.rect(worldWidth + 200, FLOOR_HEIGHT - 10),
        k.pos(-100, FLOOR_Y + 10),
        k.color(k.Color.fromHex(floorCfg.fallbackColors.body)),
        k.outline(2, k.Color.fromHex(floorCfg.fallbackColors.border)),
        k.layer('tiles'),
        k.z(STAGE_LAYER_Z.tiles + 1),
      ]);

      // Divisiones de tiles cada 32px y etiquetas métricas en el suelo
      const totalTiles = Math.ceil((worldWidth + 120) / floorCfg.tileWidth);
      for (let t = 0; t < totalTiles; t++) {
        const tx = t * floorCfg.tileWidth;
        k.add([
          k.rect(2, FLOOR_HEIGHT - 12),
          k.pos(tx, FLOOR_Y + 11),
          k.color(k.Color.fromHex('#146985')),
          k.opacity(0.45),
          k.layer('tiles'),
          k.z(STAGE_LAYER_Z.tiles + 3),
        ]);

        if (t % 4 === 0) {
          k.add([
            k.text(`//${String(t).padStart(2, '0')}`, { size: 10 }),
            k.pos(tx + 6, FLOOR_Y + 24),
            k.color(k.Color.fromHex('#38bdf8')),
            k.opacity(0.55),
            k.layer('tiles'),
            k.z(STAGE_LAYER_Z.tiles + 4),
          ]);
        }
      }

      // ====================================================================
      // CAPA 3: `props` — Racks Decorativos y Estaciones de Laboratorios
      // ====================================================================
      const stationBeacons = new Map<number, GameObj>();

      activeRooms.forEach((room, idx) => {
        const stationX = STAGE_PADDING_X + idx * STATION_SPACING;
        const propCfg = getStationPropForRoom(room.nombre, idx, PIXEL_STAGE_MANIFEST);
        const w = propCfg.width;
        const h = propCfg.height;
        const topY = FLOOR_Y - h;

        // Rack de servidores decorativo entre estaciones
        if (idx < activeRooms.length - 1) {
          const rackX = stationX + STATION_SPACING / 2;
          const rackW = 42;
          const rackH = 86;

          k.add([
            k.rect(rackW, rackH),
            k.pos(rackX - rackW / 2, FLOOR_Y - rackH),
            k.color(k.Color.fromHex('#073B4C')),
            k.outline(3, k.Color.fromHex('#FFFAEB')),
            k.layer('props'),
            k.z(STAGE_LAYER_Z.props + 1),
          ]);

          // Luces LED parpadeantes del rack
          const ledColors = ['#06D6A0', '#FFD166', '#EF476F'];
          ledColors.forEach((ledHex, ledIdx) => {
            const led = k.add([
              k.rect(6, 6),
              k.pos(rackX - rackW / 2 + 8 + ledIdx * 10, FLOOR_Y - rackH + 12),
              k.color(k.Color.fromHex(ledHex)),
              k.opacity(1),
              k.layer('props'),
              k.z(STAGE_LAYER_Z.props + 2),
            ]);
            led.onUpdate(() => {
              const tick = Math.floor(k.time() * 3 + idx + ledIdx) % 2;
              led.opacity = tick === 0 ? 1 : 0.3;
            });
          });
        }

        // Si el usuario habilitó un sprite personalizado en pixelAssets.ts, usar k.sprite()
        if (propCfg.enabled && registeredSprites.has(propCfg.id)) {
          const spriteStation = k.add([
            k.sprite(propCfg.id),
            k.pos(stationX, FLOOR_Y),
            k.anchor('bot'),
            k.area(),
            k.layer('props'),
            k.z(STAGE_LAYER_Z.props + 5),
            'room-station',
            { roomData: room, stationX },
          ]);

          spriteStation.onClick(() => {
            walkToRoomRef.current?.(room.id, true);
          });
          return;
        }

        // Respaldo Procedural Pixel-Neobrutalista (Sistema de 3 Colores Retro OS)
        // Sombra sólida dura Neobrutalista
        k.add([
          k.rect(w, h),
          k.pos(stationX - w / 2 + 5, topY + 5),
          k.color(k.Color.fromHex('#073B4C')),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 3),
        ]);

        // Contenedor principal de la Estación con Colisión (`area()`)
        const stationBox = k.add([
          k.rect(w, h),
          k.pos(stationX, FLOOR_Y),
          k.anchor('bot'),
          k.color(k.Color.fromHex(propCfg.fallbackTheme.body)),
          k.outline(4, k.Color.fromHex(propCfg.fallbackTheme.border)),
          k.area(),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 5),
          'room-station',
          { roomData: room, stationX },
        ]);

        stationBox.onClick(() => {
          walkToRoomRef.current?.(room.id, true);
        });

        // Barra superior estilo RetroWindow (#ffb220 / #38bdf8 / #fb7185)
        k.add([
          k.rect(w - 8, 24),
          k.pos(stationX - w / 2 + 4, topY + 4),
          k.color(k.Color.fromHex(propCfg.fallbackTheme.header)),
          k.outline(2, k.Color.fromHex(propCfg.fallbackTheme.border)),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 6),
        ]);

        // 3 círculos estilo Mac en la cabecera de la estación
        const macDots = ['#EF476F', '#FFD166', '#118AB2'];
        macDots.forEach((dotColor, dIdx) => {
          k.add([
            k.rect(6, 6),
            k.pos(stationX - w / 2 + 10 + dIdx * 9, topY + 13),
            k.color(k.Color.fromHex(dotColor)),
            k.layer('props'),
            k.z(STAGE_LAYER_Z.props + 7),
          ]);
        });

        // Badge de versión Optimistic Locking (`v.X`) en la cabecera
        k.add([
          k.text(`v.${room.version}`, { size: 11 }),
          k.pos(stationX + w / 2 - 34, topY + 11),
          k.color(k.Color.fromHex('#073B4C')),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 7),
        ]);

        // Nombre de la sala (truncado limpio para el cartel de estación)
        const shortTitle =
          room.nombre.length > 15 ? `${room.nombre.slice(0, 14)}.` : room.nombre;
        k.add([
          k.text(shortTitle.toUpperCase(), { size: 12, width: w - 16 }),
          k.pos(stationX - w / 2 + 10, topY + 34),
          k.color(k.Color.fromHex('#073B4C')),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 7),
        ]);

        // Sub-etiqueta de capacidad
        k.add([
          k.text(`CAP:${room.capacidad} // ID:#${room.id}`, { size: 10 }),
          k.pos(stationX - w / 2 + 10, topY + 52),
          k.color(k.Color.fromHex('#073B4C')),
          k.opacity(0.8),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 7),
        ]);

        // Puerta central Pixel Art del Laboratorio
        const doorW = 68;
        const doorH = 88;
        k.add([
          k.rect(doorW, doorH),
          k.pos(stationX - doorW / 2, FLOOR_Y - doorH),
          k.color(k.Color.fromHex('#073B4C')),
          k.outline(3, k.Color.fromHex(propCfg.fallbackTheme.border)),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 7),
        ]);

        // Ventanilla superior de la puerta
        k.add([
          k.rect(doorW - 18, 24),
          k.pos(stationX - (doorW - 18) / 2, FLOOR_Y - doorH + 10),
          k.color(k.Color.fromHex(propCfg.fallbackTheme.badgeBg)),
          k.outline(2, k.Color.fromHex(propCfg.fallbackTheme.header)),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 8),
        ]);

        // Indicador luminoso de proximidad sobre la puerta (#06D6A0 cuando el personaje está frente a ella)
        const beacon = k.add([
          k.rect(doorW - 12, 6),
          k.pos(stationX - (doorW - 12) / 2, FLOOR_Y - doorH - 10),
          k.color(k.Color.fromHex('#073B4C')),
          k.outline(2, k.Color.fromHex('#073B4C')),
          k.layer('props'),
          k.z(STAGE_LAYER_Z.props + 9),
        ]);
        stationBeacons.set(room.id, beacon);
      });

      // ====================================================================
      // CAPA 4: `actors` — Personaje / Avatar Controlable con Cámara Suave
      // ====================================================================
      const charCfg = PIXEL_STAGE_MANIFEST.characters.studentRunner;
      const initialRoom =
        activeRooms.find((r) => r.id === selectedRoomId) ?? activeRooms[0];
      const initialX = initialRoom
        ? stationPositions.get(initialRoom.id)?.x ?? STAGE_PADDING_X
        : STAGE_PADDING_X;

      let targetWalkX: number | null = null;
      let triggerSelectOnArrivalRoom: Sala | null = null;
      let currentOverlappingRoom: Sala | null = initialRoom ?? null;
      let facingDir: 1 | -1 = 1;

      const player = k.add([
        k.rect(charCfg.width, charCfg.height),
        k.pos(initialX, FLOOR_Y),
        k.anchor('bot'),
        k.color(k.Color.fromHex(charCfg.fallbackPalette.suit)),
        k.outline(3, k.Color.fromHex(charCfg.fallbackPalette.outline)),
        k.area(),
        k.layer('actors'),
        k.z(STAGE_LAYER_Z.actors + 5),
        'player',
      ]);

      // Visor retro del personaje (#06D6A0) que mira hacia la dirección de avance
      const playerVisor = k.add([
        k.rect(18, 10),
        k.pos(initialX + 4, FLOOR_Y - charCfg.height + 10),
        k.color(k.Color.fromHex(charCfg.fallbackPalette.visor)),
        k.outline(2, k.Color.fromHex(charCfg.fallbackPalette.outline)),
        k.layer('actors'),
        k.z(STAGE_LAYER_Z.actors + 6),
      ]);

      // Badge flotante "P1" sobre la cabeza del personaje
      const playerTag = k.add([
        k.text('P1', { size: 11 }),
        k.pos(initialX - 8, FLOOR_Y - charCfg.height - 16),
        k.color(k.Color.fromHex(STAGE_RETRO_PALETTE.goldHighlight)),
        k.layer('actors'),
        k.z(STAGE_LAYER_Z.actors + 7),
      ]);

      // ====================================================================
      // CAPA 5: `fx` — Indicador Flotante `[ENTER]` sobre Estación Activa
      // ====================================================================
      const promptBg = k.add([
        k.rect(132, 24),
        k.pos(initialX, FLOOR_Y - 196),
        k.anchor('center'),
        k.color(k.Color.fromHex(STAGE_RETRO_PALETTE.ctaGreen)),
        k.outline(3, k.Color.fromHex(STAGE_RETRO_PALETTE.navyDark)),
        k.layer('fx'),
        k.z(STAGE_LAYER_Z.fx + 5),
      ]);

      const promptLabel = k.add([
        k.text('[ENTER] ABRIR', { size: 11 }),
        k.pos(initialX, FLOOR_Y - 196),
        k.anchor('center'),
        k.color(k.Color.fromHex(STAGE_RETRO_PALETTE.navyDark)),
        k.layer('fx'),
        k.z(STAGE_LAYER_Z.fx + 6),
      ]);

      // Actualizar luces de estación y estado de React cuando el personaje entra en contacto con una puerta
      const setStationHighlight = (room: Sala | null) => {
        currentOverlappingRoom = room;
        stationBeacons.forEach((beaconObj, rId) => {
          beaconObj.color = k.Color.fromHex(
            room && rId === room.id
              ? STAGE_RETRO_PALETTE.ctaGreen
              : STAGE_RETRO_PALETTE.navyDark
          );
        });
        setHoveredRoom(room);
        if (room) {
          setActiveRoomId(room.id);
        }
        onHoverRoomRef.current?.(room);
      };

      // Inicializar estación activa al montar
      setStationHighlight(initialRoom ?? null);

      player.onCollide('room-station', (stationObj: GameObj) => {
        const room = (stationObj as GameObj & { roomData?: Sala }).roomData;
        if (room && currentOverlappingRoom?.id !== room.id) {
          playMenuMove();
          setStationHighlight(room);
        }
      });

      player.onCollideEnd('room-station', (stationObj: GameObj) => {
        const room = (stationObj as GameObj & { roomData?: Sala }).roomData;
        if (room && currentOverlappingRoom?.id === room.id) {
          setStationHighlight(null);
        }
      });

      // Exponer función imperativa para caminar hacia cualquier sala desde botones React o clic en estación
      walkToRoomRef.current = (roomId: number, triggerSelect = false) => {
        const target = stationPositions.get(roomId);
        if (!target) return;
        targetWalkX = target.x;
        triggerSelectOnArrivalRoom = triggerSelect ? target.room : null;
      };

      // Confirmar selección con Enter o Espacio cuando el personaje está frente a una estación
      const triggerKeyboardConfirm = () => {
        const targetRoom =
          currentOverlappingRoom ??
          activeRooms.find((r) => r.id === activeRoomId) ??
          activeRooms[0];
        if (targetRoom) {
          playMenuSelect();
          onSelectRoomRef.current?.(targetRoom);
        }
      };

      k.onKeyPress('enter', triggerKeyboardConfirm);
      k.onKeyPress('space', triggerKeyboardConfirm);

      // Posición inicial de la cámara
      const clampCamX = (x: number) => {
        const halfView = STAGE_WIDTH / 2;
        const minX = halfView;
        const maxX = Math.max(halfView, worldWidth - halfView);
        return Math.max(minX, Math.min(maxX, x));
      };

      k.camPos(clampCamX(initialX), STAGE_HEIGHT / 2);

      // Loop principal de movimiento, cámara suave y parallax horizontal
      k.onUpdate(() => {
        const dt = k.dt();
        let moveDir = 0;

        if (k.isKeyDown('left') || k.isKeyDown('a')) {
          moveDir -= 1;
          targetWalkX = null;
          triggerSelectOnArrivalRoom = null;
        }
        if (k.isKeyDown('right') || k.isKeyDown('d')) {
          moveDir += 1;
          targetWalkX = null;
          triggerSelectOnArrivalRoom = null;
        }

        // Movimiento asistido hacia una estación seleccionada desde la UI
        if (moveDir === 0 && targetWalkX !== null) {
          const diff = targetWalkX - player.pos.x;
          if (Math.abs(diff) <= 6) {
            player.pos.x = targetWalkX;
            targetWalkX = null;
            if (triggerSelectOnArrivalRoom) {
              const arrivedRoom = triggerSelectOnArrivalRoom;
              triggerSelectOnArrivalRoom = null;
              playMenuSelect();
              onSelectRoomRef.current?.(arrivedRoom);
            }
          } else {
            moveDir = diff > 0 ? 1 : -1;
          }
        }

        if (moveDir !== 0) {
          facingDir = moveDir > 0 ? 1 : -1;
          const nextX = player.pos.x + moveDir * charCfg.speed * dt;
          player.pos.x = Math.max(60, Math.min(worldWidth - 60, nextX));

          // Pequeño rebote escalonado de pasos estilo 8-bit
          const stepBounce = Math.floor(k.time() * 14) % 2 === 0 ? -3 : 0;
          player.pos.y = FLOOR_Y + stepBounce;
        } else {
          player.pos.y = FLOOR_Y;
        }

        // Sincronizar posición del visor y etiqueta P1 con el cuerpo del personaje
        playerVisor.pos.x =
          facingDir === 1
            ? player.pos.x - charCfg.width / 2 + 12
            : player.pos.x - charCfg.width / 2 + 4;
        playerVisor.pos.y = player.pos.y - charCfg.height + 10;

        playerTag.pos.x = player.pos.x - 9;
        playerTag.pos.y = player.pos.y - charCfg.height - 16;

        // Seguimiento suave de cámara horizontal (Lerp)
        const currentCam = k.camPos();
        const desiredCamX = clampCamX(player.pos.x);
        const nextCamX = currentCam.x + (desiredCamX - currentCam.x) * Math.min(1, dt * 7);
        k.camPos(nextCamX, STAGE_HEIGHT / 2);

        // Actualizar pilares de fondo en Parallax horizontal
        const camOffset = nextCamX - STAGE_WIDTH / 2;
        for (const p of parallaxPillars) {
          p.obj.pos.x = p.baseX - camOffset * 0.35;
        }

        // Posicionar indicador flotante `[ENTER] ABRIR` en capa `fx`
        if (currentOverlappingRoom) {
          const stPos = stationPositions.get(currentOverlappingRoom.id);
          const bobOffset = Math.floor(k.time() * 4) % 2 === 0 ? -4 : 0;
          const fxX = stPos ? stPos.x : player.pos.x;
          const fxY = FLOOR_Y - 190 + bobOffset;
          promptBg.hidden = false;
          promptLabel.hidden = false;
          promptBg.pos.x = fxX;
          promptBg.pos.y = fxY;
          promptLabel.pos.x = fxX;
          promptLabel.pos.y = fxY;
        } else {
          promptBg.hidden = true;
          promptLabel.hidden = true;
        }
      });
    });

    k.go('lab-selector-stage');

    return () => {
      walkToRoomRef.current = null;
      if (kaplayRef.current) {
        try {
          kaplayRef.current.quit();
        } catch {
          // Ignorar errores de limpieza en desmontaje
        }
        kaplayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRooms]);

  const displayedRoom =
    hoveredRoom ??
    activeRooms.find((r) => r.id === activeRoomId) ??
    activeRooms[0] ??
    null;

  return (
    <div
      className={`w-full border-4 border-[#dd6902] bg-[#ffdf88] text-[#073B4C] overflow-hidden select-none ${className}`}
    >
      {/* Cabecera estilo RetroWindow (#ffb220) */}
      <div className="bg-[#ffb220] px-3.5 py-2 border-b-[3px] border-[#dd6902] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[#073B4C]">
            stage_selector_2d.exe {'//'} KAPLAY LAYERED STAGE
          </span>
        </div>

        <div className="flex items-center gap-2 font-pixel text-[10px] font-bold uppercase">
          <span className="px-2 py-0.5 border-2 border-[#073B4C] bg-[#fef3c7] text-[#073B4C]">
            ◀ A / D ▶ CAMINAR
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 border-2 border-[#073B4C] bg-[#06D6A0] text-[#073B4C]">
            [ENTER] SELECCIONAR
          </span>
        </div>
      </div>

      {/* Barra rápida de salto directo a estaciones (Sincronizada con el personaje en el Canvas) */}
      {showHud && (
        <div className="bg-[#fef3c7] px-3 py-2 border-b-2 border-[#dd6902] flex items-center gap-2 overflow-x-auto">
          <span className="font-pixel text-[10px] font-bold uppercase text-[#073B4C] shrink-0">
            {'//'} ESTACIONES ({activeRooms.length}):
          </span>
          <div className="flex items-center gap-1.5">
            {activeRooms.map((room) => {
              const isCurrent = displayedRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleQuickJump(room)}
                  className={`px-2.5 py-1 border-2 font-pixel text-[10px] font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'border-[#073B4C] bg-[#06D6A0] text-[#073B4C]'
                      : 'border-[#dd6902] bg-[#ffdf88] text-[#073B4C] hover:bg-[#ffb220]'
                  }`}
                >
                  <span>{room.nombre}</span>
                  <span className="opacity-75">v.{room.version}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Viewport del Canvas 2D con escalado Pixel-Art nítido */}
      <div className="relative w-full bg-[#073B4C] overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: `${height}px`,
            display: 'block',
            imageRendering: 'pixelated',
          }}
          className="w-full block cursor-pointer focus:outline-none"
        />
      </div>

      {/* Barra de estado inferior sincronizada en tiempo real con las colisiones del personaje */}
      {showHud && displayedRoom && (
        <div className="bg-[#ffdf88] px-3.5 py-2.5 border-t-[3px] border-[#dd6902] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 border-2 border-[#0284c7] bg-[#bae6fd] font-pixel text-[10px] font-bold uppercase text-[#073B4C]">
              PUERTA #{displayedRoom.id} {'//'} v.{displayedRoom.version}
            </span>
            <span className="font-pixel text-xs sm:text-sm font-bold uppercase text-[#073B4C] truncate">
              {displayedRoom.nombre}
            </span>
            <span className="font-body text-sm text-[#073B4C]/80">
              ({displayedRoom.ubicacion} · Cap: {displayedRoom.capacidad} personas)
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleConfirmCurrentRoom(displayedRoom)}
            className="px-3.5 py-1.5 border-2 border-[#073B4C] bg-[#06D6A0] hover:bg-[#05b888] active:translate-y-0.5 font-pixel text-xs font-bold uppercase text-[#073B4C] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <PixelIcon name="play" size={14} color="#073B4C" />
            <span>ENTRAR A SALA</span>
          </button>
        </div>
      )}
    </div>
  );
}
