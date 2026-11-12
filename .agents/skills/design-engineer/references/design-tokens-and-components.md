# Referencia de Tokens, Componentes y Patrones UI (`LabReserva`)

Guía rápida de implementación para mantener consistencia pixel-perfect en `/frontend`.

---

## 1. Tokens de Color y Variables CSS

Definidos en [`globals.css`](../../../../frontend/src/app/globals.css) y [`tailwind.config.ts`](../../../../frontend/src/tailwind.config.ts):

```css
:root {
  --neo-dark: #073B4C;   /* Texto principal, bordes oscuros y franja superior del cielo */
  --neo-bg: #FFFAEB;     /* Crema claro para textos sobre fondo oscuro */
  --neo-blue: #118AB2;   /* Azul acento retro / estrellas / remates */
  --neo-pink: #EF476F;   /* Rosa/Rojo acento retro / botón cerrar / alertas */
  --neo-yellow: #FFD166; /* Amarillo acento retro / selección / títulos destacados */
  --neo-green: #06D6A0;  /* Verde exclusivo para CTA, rutas activas y celdas disponibles */
}
```

### Gradiente Duro del Cielo Pixelado (`PixelSkyBackground.tsx`)
6 franjas horizontales de igual altura (`flex-1`):
1. `#073B4C` (Superior)
2. `#094559`
3. `#0D5167`
4. `#105E76`
5. `#146A85`
6. `#187795` (Horizonte inferior)

Colores permitidos en estrellas del cielo (sin estrellas verdes, commit `ebf6945`):
- `#FFD166`, `#118AB2`, `#EF476F`.

---

## 2. Recetas de Componentes Base

### A. Ventana Retro OS (`RetroWindow`)
```tsx
import RetroWindow from '@/components/RetroWindow';

<RetroWindow
  title="NOMBRE_MODULO.SYS"
  badge="ETIQUETA"
  color="yellow" // 'yellow' | 'blue' | 'red'
  actionButton={<PixelButton variant="warning" size="sm">Acción</PixelButton>}
>
  {/* Contenido con texto #073B4C */}
</RetroWindow>
```
- Nombres de archivo sugeridos para `title`:
  - `.SYS` para controles del sistema y formularios (`HORARIO_DISPONIBILIDAD.SYS`, `PARAMETROS_ENTRADA.SYS`).
  - `.EXE` para módulos ejecutables o interactivos (`RECOMENDADOR_OPTIMO.EXE`, `SISTEMA_ACCESO_AUTH.EXE`).
  - `.DAT` para catálogos y salidas de datos (`INVENTARIO_SALAS.DAT`, `SALIDA_OPTIMA.DAT`).
  - `.LOG` para auditorías y colas (`AUDITORIA_GLOBAL_RESERVAS.LOG`, `BULLMQ.LOG`).

### B. Modal Flotante Retro OS
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-none">
  <div className="w-full max-w-md border-4 border-[#dd6902] bg-[#ffdf88] overflow-hidden text-[#073B4C] shadow-2xl animate-in fade-in zoom-in-95 duration-100">
    {/* Header #ffb220 con 3 puntos Mac y botón cerrar #EF476F */}
    <div className="flex items-center justify-between border-b-[3px] border-[#dd6902] bg-[#ffb220] px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-block h-3 w-3 rounded-full bg-[#EF476F] border border-[#dd6902]" />
          <span className="inline-block h-3 w-3 rounded-full bg-[#FFD166] border border-[#dd6902]" />
          <span className="inline-block h-3 w-3 rounded-full bg-[#118AB2] border border-[#dd6902]" />
        </div>
        <h3 className="font-pixel text-xs font-bold uppercase tracking-wider text-[#073B4C] ml-1.5">
          TITULO_MODAL.SYS
        </h3>
      </div>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar modal"
        className="flex h-4 w-4 items-center justify-center border-2 border-[#dd6902] bg-[#EF476F] text-white font-pixel font-bold text-[10px] leading-none hover:brightness-110 active:scale-95 transition-transform"
      >
        ✕
      </button>
    </div>

    {/* Cuerpo */}
    <div className="space-y-4 p-5 text-[#073B4C]">
      {/* Contenido */}
    </div>

    {/* Footer con CTA en Verde */}
    <div className="flex items-center justify-end gap-3 border-t-[3px] border-[#dd6902] bg-[#ffb220]/25 px-5 py-3">
      <button
        type="button"
        onClick={onCerrar}
        className="border-2 border-[#dd6902] bg-transparent px-3 py-1.5 font-pixel text-xs font-bold uppercase text-[#073B4C] hover:bg-[#ffb220]/50 transition-colors"
      >
        Cancelar
      </button>
      <PixelButton variant="success" size="md" icon={<PixelIcon name="check" size={16} />}>
        Confirmar Acción
      </PixelButton>
    </div>
  </div>
</div>
```

### C. Tarjetas de Métricas (KPI Cards)
Alternar entre los 3 colores oficiales (`blue`, `yellow`, `red`):
```tsx
{/* Azul */}
<div className="p-4 border-4 border-[#0284c7] bg-[#bae6fd] text-[#073B4C]">
  <span className="font-pixel text-[11px] font-bold text-[#0284c7] uppercase block">
    {'//'} Métrica Azul
  </span>
  <div className="mt-2 flex items-baseline justify-between">
    <span className="font-pixel text-3xl font-bold text-[#073B4C]">42</span>
    <span className="font-pixel text-xs text-[#073B4C]/70 font-bold">UNIDAD</span>
  </div>
</div>
```

### D. Estructura Estándar de Página
```tsx
<div className="min-h-screen text-neo-dark flex flex-col">
  <Navbar />
  <main className="flex-1 mx-auto w-full max-w-7xl p-3 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-hidden box-border">
    {/* Secciones y RetroWindows */}
  </main>
</div>
```
