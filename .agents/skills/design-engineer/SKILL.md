---
name: design-engineer
description: >-
  Actúa como Senior Web Designer, Senior Frontend Engineer y Design Engineer especializado
  en el sistema de diseño Pixel-Neobrutalista / Retro OS de LabReserva (Next.js 14, TypeScript,
  TailwindCSS). Usa esta skill siempre que el usuario solicite diseñar, crear, refactorizar,
  estilizar o auditar páginas, componentes UI, layouts responsivos, micro-interacciones o
  experiencia de usuario en `/frontend`.
---

# Design Engineer & Senior Frontend Skill (`laboratorio_mdw`)

Esta skill define los estándares de **Design Engineering**, **Arquitectura Frontend** y **Sistema de Diseño Pixel-Neobrutalista / Retro OS** extraídos de las convenciones e historial de la rama `main` del repositorio.

---

## 1. Identidad Visual y Filosofía de Diseño

El frontend de **LabReserva** combina tres pilares visuales:
1. **Pixel-Neobrutalismo**: Bordes sólidos gruesos (`border-2`, `border-3`, `border-4`), esquinas rectas (`rounded-none`), cero sombras difusas (`shadow-neo: none`) y alto contraste cromático.
2. **Retro Desktop OS (`*.SYS`, `*.EXE`, `*.DAT`, `*.LOG`)**: Contenedores enmarcados como ventanas de sistema operativo clásico ([`RetroWindow`](../../../frontend/src/components/RetroWindow.tsx)) con controles de ventana (`_`, `□`, `✕`) y etiquetas técnicas precedidas por `//`.
3. **Arcade & Pixel Art Nítido con Efecto Parallax**: Fondo global de cielo nocturno en **5 franjas** ([`PixelSkyBackground`](../../../frontend/src/components/PixelSkyBackground.tsx)) que suman exactamente el 100% de la altura del viewport (`100svh` en mobile, `100vh` en desktop), con **generación inteligente de estrellas libre de colisiones** (nunca se generan sobre texto, iconos o avatar de usuario, respetando un margen mínimo de 1rem / 16px), estrellas animadas por pasos (`steps(1, end)`), navegación por teclado en landing y glifos SVG renderizados con `shapeRendering: 'crispEdges'`.

---

## 2. Reglas Estrictas de Color (Sistema de 3 Colores + Verde CTA)

> **Regla de Oro (Commit `5b33134` y `12de010`)**: Las ventanas, tarjetas, tablas y modales utilizan exclusivamente **3 temas cromáticos** (Amarillo, Azul, Rojo). El color **Verde (`#06D6A0`) está reservado exclusivamente para botones CTA principales**, indicadores activos/online y el estado hover de celdas libres.

### A. Sistema de 3 Colores para Ventanas, Cards y Tablas
Todo texto principal dentro de ventanas y tarjetas utiliza siempre **`#073B4C`** (`text-[#073B4C]`).

| Tema | Fondo Cuerpo (200) | Fondo Cabecera (400) | Borde / Acento (600) | Fondo Inputs / Badges (100) | Uso Semántico |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Amarillo (`yellow`)** | `#ffdf88` | `#ffb220` | `#dd6902` | `#fef3c7` | Formularios, filtros, grilla de horarios, modales de confirmación, nav móvil. |
| **Azul (`blue`)** | `#bae6fd` | `#38bdf8` | `#0284c7` | `#e0f2fe` | Catálogos, contexto técnico/algoritmos, "Mi Reserva", drawer BullMQ. |
| **Rojo (`red`)** | `#fecdd3` | `#fb7185` | `#e11d48` | `#ffe4e6` | Resultados de optimización, auditoría, alertas `409 Conflict`, bloques "Ocupado". |

### B. Regla de Inputs y Controles de Formulario (Variante 100)
- Todos los `<input>`, `<select>` y `<textarea>` dentro de contenedores amarillos deben usar fondo variante 100 **`bg-[#fef3c7]`** con **`border-2 border-[#dd6902]`**, texto **`text-[#073B4C]`**, tipografía `font-pixel text-xs font-bold` y mantener `focus:bg-[#fef3c7] focus:outline-none`.
- Las etiquetas (`<label>`) llevan prefijo técnico `//`:
  ```tsx
  <label className="block font-pixel text-xs font-bold uppercase text-[#073B4C]">
    {'//'} Nombre del Campo
  </label>
  ```

### C. Exclusividad del Verde (`#06D6A0`)
- **Permitido**:
  - Botones CTA primarios (`<PixelButton variant="success">` o `bg-[#06D6A0] text-[#073B4C] border-2 border-[#073B4C]`).
  - Estado deshabilitado de CTA: `bg-[#a7f3d0] text-[#073B4C]/50 border-2 border-[#073B4C]/30 cursor-not-allowed`.
  - Hover de celda disponible en calendario (`hover:bg-[#06D6A0]/35`).
  - Indicador de ruta activa en `Navbar`, cursor arcade `play` en Landing y punto de sesión activa.
- **Prohibido**:
  - Usar verde como color de ventana, card o tabla completa.

---

## 3. Sistema Tipográfico

Configurado en [`layout.tsx`](../../../frontend/src/app/layout.tsx) y [`tailwind.config.ts`](../../../frontend/src/tailwind.config.ts):
- **`font-arcade` / `font-cta` (`Press Start 2P`, `--font-arcade`)**:
  - Obligatorio en el **Título Principal de Home** (con proporción 1:2 entre `"Reserva tu"` y `"Laboratorio"`), el **Seleccionador de Menú Principal** y **todos los botones CTA** ([`PixelButton`](../../../frontend/src/components/PixelButton.tsx) y botones de acción principales).
- **`font-pixel` (`DotGothic16`, `--font-pixel`)**:
  - Usado en subtítulos, cabeceras de ventanas (`RetroWindow`), badges, pestañas, celdas de estado, etiquetas `//` y metadatos técnicos (`v.1`, `#ID`, horarios `08:00 // 09:00`).
  - Usar casi siempre con `font-bold uppercase tracking-wider`.
- **`font-body` (`VT323`, `--font-body`)**:
  - Fuente base del `<body>`. Usada para párrafos descriptivos, subtítulos explicativos, textos de ayuda y cuerpos de notificaciones.

---

## 4. Ingeniería Responsiva y Layout (Commits `2310a25` y `161eaf6`)

### A. Cálculo Dinámico de Ancho (`useWindowWidth`)
Para evitar que tablas anchas o ventanas retro desborden el viewport horizontal en móviles y tablets, cualquier contenedor ancho o tabla debe usar [`useWindowWidth`](../../../frontend/src/hooks/useWindowWidth.ts):
```tsx
const screenWidth = useWindowWidth();
const dynamicMaxWidth = screenWidth
  ? screenWidth < 640
    ? `${Math.max(280, screenWidth - 28)}px`
    : screenWidth < 1024
    ? `${Math.max(540, screenWidth - 48)}px`
    : '100%'
  : '100%';
```
Aplicar `style={{ maxWidth: dynamicMaxWidth }}` junto con `w-full min-w-0 overflow-x-auto box-border`.

### B. Navegación Adaptativa ([`Navbar.tsx`](../../../frontend/src/components/Navbar.tsx))
1. **Header Transparente Superior**: `sticky top-0 z-40 bg-transparent`, sin colisionar con [`PixelSkyBackground`](../../../frontend/src/components/PixelSkyBackground.tsx) (`fixed inset-0` con 6 franjas originales en `h-screen` + una 7ma franja `#1C84A5` estirada hacia el fondo con Parallax `0.28x`).
2. **Header Especial en Home (`pathname === '/'`)**:
   - No renderiza enlaces de navegación ni la barra inferior móvil; muestra el **HUD Arcade a la izquierda** (`1UP` en `#FFD166`, corazones y 5 puntos), el **Logo MDW centrado** (`absolute left-1/2 -translate-x-1/2`) y el **selector de usuario redondo a la derecha** (`ml-auto`).
3. **Botón de Audio 8-bit Flotante**:
   - Ubicado en la **esquina inferior derecha** (`fixed right-5 bottom-5` en Home, `bottom-20 md:bottom-5` en páginas internas), solo icono (`size={34}`, tamaño similar al logo) en color blanco (`#FFFFFF`).
4. **Mobile en Páginas Internas (`< 768px` / `md:hidden`)**:
   - Header superior compacto: Logo SVG a la izquierda; botón `Simular` (abre modal popup) + botón `Usuario/Login` redondo con relleno `#FFD166` a la derecha.
   - **Barra de navegación inferior fija**: `<aside className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t-4 border-[#dd6902] bg-[#ffdf88] shadow-2xl">` con `grid-cols-4 h-16`.
5. **iPad y Desktop (`>= 768px` / `hidden md:flex`)**:
   - En páginas internas: Logo SVG + links horizontales limpios (cambio de color a `#FFD166` en hover, con sonido de Pausa NES al navegar).
   - En la esquina derecha: **Avatar redondo `w-14 h-14 rounded-full`** con relleno amarillo (`border-2 border-[#FFFAEB] bg-[#FFD166] text-[#0D5167]`), punto verde de estado arriba (`#06D6A0`), nombre centrado abajo y botón `chevron-down` lateral derecho que despliega el dropdown amarillo de simulación de usuarios.

---

## 5. Transparencia Técnica en la UI (Requisitos de Dominio)

Como Design Engineer de este proyecto, la interfaz debe evidenciar visualmente los mecanismos de backend en todo momento:
1. **Bloqueo Optimista (`version`)**: Mostrar siempre el badge `v.{sala.version}` en encabezados de salas, modales de confirmación (`Versión Enviada: v.X`) y registros de reservas (`v_ok:{reserva.version_sala_aplicada}`).
2. **Estado de Caché y Tiempo Real**: Mostrar badges de origen de datos (`⚡ CACHE: REDIS` vs `🐘 DB: POSTGRES`), estado de WebSockets (`WS: ONLINE`) y feedback inmediato ante colisiones `HTTP 409 Conflict`.
3. **Calendario de Disponibilidad ([`CalendarioGrid.tsx`](../../../frontend/src/components/CalendarioGrid.tsx))**:
   - Encabezados de sala con fondo uniforme `#ffb220` diferenciados por el color del [`PixelIcon`](../../../frontend/src/components/PixelIcon.tsx) dentro de una caja `#fef3c7`.
   - Celdas de estado sólidas donde **toda la celda (`<td>`)** recibe el color de su estado (`#38bdf8` para "MI RESERVA", `#fb7185` para "OCUPADO", y `#ffdf88` con `hover:bg-[#06D6A0]/35` para "DISPONIBLE").

---

## 6. Flujo de Trabajo y Verificación

Cuando realices cambios de diseño o frontend:
1. **Reutiliza las primitivas existentes**: Usa [`RetroWindow`](../../../frontend/src/components/RetroWindow.tsx), [`PixelButton`](../../../frontend/src/components/PixelButton.tsx), [`PixelBadge`](../../../frontend/src/components/PixelBadge.tsx) y [`PixelIcon`](../../../frontend/src/components/PixelIcon.tsx) antes de crear marcado duplicado. Consulta [design-tokens-and-components.md](./references/design-tokens-and-components.md) para ver recetas exactas.
2. **Verifica iconos Pixel Art**: Si agregas un nuevo glifo a [`PixelIcon.tsx`](../../../frontend/src/components/PixelIcon.tsx), constrúyelo con trazos ortogonales en cuadrícula `24x24` y mantén `style={{ shapeRendering: 'crispEdges' }}`.
3. **Valida Compilación y Tipado**:
   Ejecuta en `/frontend`:
   ```bash
   npm run build
   ```
   Asegúrate de no introducir errores de TypeScript (`any` prohibido) ni de ESLint.
4. **Convención de Commits en la Rama**:
   - `feat(ui): ...` para cambios de sistema visual, colores, tipografía e iconos.
   - `feat(responsive): ...` para adaptaciones mobile/iPad/desktop y cálculo de ancho.
   - `feat(frontend): ...` para nuevas vistas, flujos o componentes completos.
   - `feat(integration): ...` para conexión de componentes con API/WebSockets/Context.

---

## 7. Interoperabilidad con Herramientas de Diseño (Figma, html.to.design, Capture Modes)

Como Design Engineer, es imperativo **facilitar activamente la comunicación e importación bidireccional entre código y herramientas de diseño** (Figma, plugins de captura como `html.to.design`, Storybook, exportadores de assets, etc.):

1. **Soporte de Modos de Captura (`?figma=1`)**:
   - Siempre que existan animaciones complejas, librerías de smooth scrolling (GSAP `ScrollSmoother`) o efectos con `position: fixed` / `pin: true`, implementa un modo de captura condicional mediante query param (`?figma=1`):
     - **Desactivar el smooth scrolling y pins**: Desactivar `ScrollSmoother` y `ScrollTrigger` con pin para devolverle al documento el scroll nativo con altura completa y `overflow: visible`, permitiendo capturas full-page limpias y sin recortes de altura.
     - **Presentar estados finales consolidados**: Renderizar capas o elementos animados directamente en su posición final (`translateY(0)`), evitando que se capturen fuera de pantalla o con offsets transitorios.
     - **Imágenes y vectores en el DOM**: Usar etiquetas `<img>` o `<svg>` en el DOM (en lugar de depender únicamente de `background-image` en CSS) para que las herramientas de importación a Figma detecten y extraigan los vectores con su resolución nativa.
2. **Dimensiones Explícitas en SVGs Críticos**:
   - En logos o glifos clave (como `LogoMDW`), declara siempre atributos explícitos `width={...}` y `height={...}` además de las clases responsivas de Tailwind (`h-7 md:h-8 w-auto`), evitando que plugins de Figma colapsen el bounding box a 0.
3. **Jerarquías de Capa Limpias**:
   - Mantener contextos de apilamiento ordenados (`z-index`) para que las capas generadas en Figma respeten la relación visual exacta entre cielo, UI y footer.
