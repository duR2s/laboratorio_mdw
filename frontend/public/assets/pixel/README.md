# Guía de Assets Pixel Art — Escenario 2D (`KAPLAY`)

Este directorio almacena todos los recursos gráficos en **Pixel Art** (`.png`, `.svg`, `.webp` y `.json` de Aseprite) utilizados por el motor **KAPLAY** en el selector 2D horizontal de laboratorios y salas.

Todos los archivos depositados aquí deben registrarse en el manifiesto centralizado:
- [`frontend/src/lib/pixelAssets.ts`](../../../src/lib/pixelAssets.ts)

---

## 1. Estructura de Directorios

| Carpeta | Capa (`STAGE_LAYERS`) | Contenido | Ejemplos |
| :--- | :--- | :--- | :--- |
| [`backgrounds/`](./backgrounds/) | `bg` (`z: 0–99`) | Capas de fondo y parallax horizontal: cielo estrellado, siluetas de campus, pasillos lejanos, ventanas. | `bg-campus-sky.png`, `bg-hallway-far.svg` |
| [`tilesets/`](./tilesets/) | `tiles` (`z: 100–199`) | Mosaicos repetibles de suelo, plataformas, zócalos, muros y bordes de nivel (preferentemente en grillas de `16x16` o `32x32` px). | `tile-lab-floor.png`, `tileset-corridor-32x32.png` |
| [`props/`](./props/) | `props` (`z: 200–299`) | Objetos estáticos o interactivos del escenario: puertas de laboratorios, estaciones de cómputo, escritorios, racks de servidores, carteles LED y semáforos de estado. | `prop-door-lab.png`, `prop-server-rack.svg`, `prop-status-lamp.png` |
| [`characters/`](./characters/) | `actors` (`z: 300–399`) | Sprites y spritesheets del personaje/avatar del estudiante o cursor móvil animado (idle, walk, interact). | `char-student-sheet.png`, `char- drone-cursor.png` |
| [`ui/`](./ui/) | `fx` (`z: 400–499`) | Indicadores flotantes sobre el escenario, flechas de interacción (`[ENTER]`), cursores pixelados, partículas y marcos. | `ui-prompt-enter.svg`, `ui-arrow-select.png` |

---

## 2. Convenciones de Nombres Recomendadas

Usa siempre **`kebab-case`** en minúsculas con prefijo semántico según la categoría:

- **Fondos (`backgrounds/`)**: `bg-<escena>-<capa>.<ext>`
  - Ejemplo: `bg-campus-far.png`, `bg-campus-mid.png`
- **Tilesets (`tilesets/`)**: `tile-<nombre>.<ext>` o `tileset-<nombre>-<ancho>x<alto>.<ext>`
  - Ejemplo: `tile-floor-metal.png`, `tileset-lab-32x32.png`
- **Objetos / Estaciones (`props/`)**: `prop-<objeto>[-<variante>].<ext>`
  - Ejemplo: `prop-door-open.png`, `prop-door-locked.png`, `prop-pc-terminal.svg`
- **Personajes (`characters/`)**: `char-<nombre>[-<anim>].<ext>`
  - Ejemplo: `char-student-32x48.png`
- **Indicadores UI (`ui/`)**: `ui-<elemento>.<ext>`
  - Ejemplo: `ui-key-enter.svg`, `ui-badge-v.png`

---

## 3. Especificaciones Técnicas para Pixel Art Nítido

1. **Sin suavizado (Nearest-Neighbor)**: Exporta tus PNG en escala `1x` (por ejemplo, `16x16`, `32x32` o `64x64`) sin suavizado de bordes. KAPLAY está configurado con `texFilter: 'nearest'` y `crisp: true` para escalar cada píxel con bordes ortogonales perfectos.
2. **SVG Pixel Art**: Si exportas en `.svg`, incluye `shape-rendering="crispEdges"` en el nodo `<svg>` raíz y alinea todos los vértices a coordenadas enteras.
3. **Spritesheets**: Si exportas una tira horizontal o cuadrícula de animación, indica `sliceX` y `sliceY` junto con el diccionario `anims` dentro de [`pixelAssets.ts`](../../../src/lib/pixelAssets.ts).
