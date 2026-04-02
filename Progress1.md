# HestiaAI — Progress Tracker

> Presentación tribunal: **04/05/2026** | Entrega final: **11/05/2026**

---

## Sección 1: Conceptualización y Planificación

- [x] Conceptualización de la idea — *09/02*
- [x] Planificación / arquitectura (Gantt) — *01/03*

---

## Sección 2: Base de Código y Diseño

- [x] Repositorio base + Next.js 14 + Tailwind + Prisma — *05/03*
- [x] Integración Gemini 2.5 Flash — *10/03*
- [x] Migración SQLite → Supabase PostgreSQL — *12/03*
- [x] Wireframes de Alta Fidelidad (Figma) — *15/03*

---

## Sección 3: Desarrollo Core

- [x] Supabase Auth + RLS + middleware /host/* — *25/03*
- [x] RAG sobre manuales PDF (pdf-parse) — *05/04*
- [x] Generación de QR por propiedad (descargable PNG) — *08/04*
- [x] Notificaciones email con Resend al crear incidencia — *10/04*
- [x] **Three.js avanzado** — raycasting + hover sobre piezas — *12/04*
- [x] **Visor 3D de electrodomésticos** — GLTFLoader + OrbitControls + modal en vista huésped
- [x] Realtime dashboard (Supabase Realtime) — *16/04*

> **HITO: Beta Funcional** — 19/04

---

## Sección 4: Fixes UI ✅ Completada

- [x] Fix 1 — Métricas del dashboard clicables
- [x] Fix 2 — Ocultar texto crudo del PDF en vista de electrodoméstico
- [x] Fix 3 — Etiquetas de incidencias en español
- [x] Fix 4 — Notas internas + responder al huésped desde el panel
- [x] Fix 5 — Filtro y búsqueda de incidencias
- [x] Fix 6 — Detectar placeholders sin completar en instrucciones
- [x] Fix 7 — URL del QR preparada para producción
- [x] Fix 8 — Estado de propiedad con selector (activa/con huésped/inactiva)
- [x] Fix 9 — Validar nombres duplicados de propiedad
- [x] Fix 10 — Botón login bloqueado en carga + recuperación de contraseña

---

## Sección 5: Testeo y Pulido ✅

- [x] **Chat → botón "Ver en 3D"** — `detectAppliance()` en ChatInterface detecta menciones de electrodomésticos en respuestas de la IA y muestra botón pill "Ver en 3D"
- [x] **Foto adjunta en incidencias** — cámara/galería → preview → Gemini Vision analiza la foto → rellena descripción automáticamente (`/api/analyze-photo`)
- [ ] Testeo en móvil + optimización Three.js — *22/04* 🔴 pendiente (manual)

---

## Sección 6: Diferenciadores y Analytics ✅

- [x] **Dashboard ESG** — 3 KPIs: CO₂ ahorrado (visitas × 1,2 kg), visitas técnicas evitadas (incidencias resueltas), tiempo medio de resolución
- [x] **Analytics para el anfitrión** — top 5 categorías de preguntas frecuentes por keywords sobre todos los mensajes de huéspedes almacenados en BD, con barras de porcentaje
- [x] **Categorización automática de incidencias** — Gemini clasifica categoría y prioridad en `/api/incidents` POST sin acción manual

---

## Sección 7: Defensa y Entrega — Crítico

- [ ] **PWA instalable** — el huésped añade HestiaAI a su pantalla de inicio como app nativa, sin App Store — *02/05*
- [ ] **Vídeo demo** — flujo completo: QR → chat → guía 3D → incidencia → notificación email — *02/05*
- [ ] **Presentación técnica tribunal** — *04/05* 🔴
  - Estructura sugerida: Problema → Solución → Demo en vivo → Stack técnico → Diferenciadores vs competencia → Métricas ESG → Roadmap
- [ ] **Documentación y entrega final** — *11/05* 🔴
  - README con instrucciones de despliegue, arquitectura del sistema, decisiones de diseño

---

## Mejoras competitivas — diferenciadores frente a Enso Connect / Hostfully / Touch Stay

### Implementadas ✅

- [x] **Multiidioma automático en chat** — Gemini detecta el idioma del huésped y responde en él. UI adaptada en 7 idiomas vía `navigator.language`
- [x] **Visor 3D de electrodomésticos** — Three.js + GLTFLoader + OrbitControls + raycasting — ningún competidor lo tiene

### Implementadas ✅ (adicionales)

- [x] **Chat → botón "Ver en 3D"** — conectado con el visor Three.js existente
- [x] **Foto adjunta en incidencias** — Gemini Vision genera descripción automática
- [x] **Categorización automática de incidencias** — Gemini clasifica categoría y prioridad
- [x] **Analytics para el anfitrión** — preguntas más frecuentes + barras de porcentaje
- [x] **Dashboard ESG** — CO₂, visitas evitadas, tiempo medio resolución

### Pendientes

- [ ] **PWA instalable** — añadir a pantalla de inicio sin App Store

---

## Sección 8: Flujo 3D ✅

- [x] **Feature 1 — Subida de GLB** — campo `glbUrl` en BD, bucket `appliance-models` en Supabase Storage (público), endpoint `/api/appliances/upload-glb` (valida 50MB y extensión), helper `uploadGLB()` con service_role key, botón en panel del electrodoméstico con badge "Modelo 3D ✓"
- [x] **Feature 2 — Guía de escaneo** — `ScanGuideModal.tsx` stepper de 5 pasos (app → preparar → fotografiar → KIRI Engine → subir GLB), accesible desde botón `?` en el formulario de subida
- [x] **Feature 3 — Hotspots** — tabla `ApplianceHotspot` en BD, `/api/appliances/hotspots` (GET/POST/DELETE), `ApplianceHotspotEditor` modal para anfitrión (click sobre modelo → input flotante → guarda coordenadas 3D), `ApplianceViewer` carga esferas rojas al abrir y muestra tooltip al hacer click

---

## Sección 9: Rediseño vista del huésped — antes del 22/04

> **Problema:** La vista actual del huésped tiene un mensaje de bienvenida demasiado largo que ocupa media pantalla, un gran vacío en el centro, las preguntas sugeridas apiladas verticalmente, y una pestaña "Info" redundante ya que el LLM puede responder todo eso directamente.

---

### Cambio 1 — Eliminar pestañas y simplificar a pantalla única

**Problema:** Hay 3 pestañas (Asistente / Info / Mis incidencias). La pestaña "Info" es completamente redundante — el huésped puede preguntar lo mismo al chat y obtener una respuesta más completa y personalizada. Eliminarla simplifica la navegación y elimina confusión.

**Solución:** Eliminar el componente de tabs. La vista queda como una sola pantalla sin navegación. "Mis incidencias" pasa a ser accesible solo después de reportar una (botón en el flujo de reporte).

**Archivo a editar:** `app/guest/[propertyId]/page.tsx`

```tsx
// ANTES — estructura con tabs
<Tabs defaultValue="assistant">
  <TabsList>
    <TabsTrigger value="assistant">Asistente</TabsTrigger>
    <TabsTrigger value="info">Info</TabsTrigger>           {/* ← ELIMINAR */}
    <TabsTrigger value="incidents">Mis incidencias</TabsTrigger> {/* ← MOVER */}
  </TabsList>
</Tabs>

// DESPUÉS — pantalla única sin tabs
<div className="flex flex-col h-screen bg-white">
  <GuestHeader property={property} />
  <WelcomeBanner />
  <QuickAccessGrid onCardClick={handleQuickQuestion} />
  <ChatArea messages={messages} />
  <QuickPills onPillClick={handleQuickQuestion} />
  <IncidentButton />
  <ChatInput onSend={handleSend} />
</div>
```

**Tiempo estimado:** 20 minutos

- [ ] Eliminar el componente de tabs de `app/guest/[propertyId]/page.tsx`
- [ ] Eliminar la ruta/componente de la pestaña "Info" si existe por separado
- [ ] Mover el acceso a "Mis incidencias" al flujo post-reporte

---

### Cambio 2 — Reemplazar mensaje de bienvenida largo por banner compacto

**Problema:** El mensaje de bienvenida actual ocupa casi media pantalla en móvil con un texto largo genérico. El huésped necesita llegar al chat lo antes posible, no leer un párrafo.

**Solución:** Reemplazar la burbuja de chat larga por un banner compacto de una línea integrado en el header verde oscuro, manteniendo la identidad visual de Hestia IA.

**Archivo a crear:** `components/guest/WelcomeBanner.tsx`

```tsx
// ANTES — burbuja de chat larga como primer mensaje
{
  role: 'assistant',
  content: '¡Hola! Soy Hestia, tu asistente virtual para este alojamiento. Estoy aquí para ayudarte con cualquier duda sobre el apartamento, los electrodomésticos o cualquier incidencia. ¿En qué puedo ayudarte?'
}
// Ocupa ~180px en móvil

// DESPUÉS — banner compacto bajo el header
export function WelcomeBanner() {
  return (
    <div className="bg-[#0F6E56] px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center
                      justify-center flex-shrink-0">
        <UserIcon className="w-4 h-4 text-white" />
      </div>
      <p className="text-sm text-[#E1F5EE] leading-snug">
        Hola, soy <strong className="text-white">Hestia</strong>.
        Estoy aquí 24h para cualquier duda del apartamento.
      </p>
    </div>
  )
}
// Ocupa ~52px — ahorra ~128px de espacio útil en móvil
```

**Tiempo estimado:** 15 minutos

- [ ] Crear `components/guest/WelcomeBanner.tsx`
- [ ] Eliminar el mensaje de bienvenida del array inicial de mensajes del chat
- [ ] Añadir `<WelcomeBanner />` entre el header y las cards de acceso rápido

---

### Cambio 3 — Añadir grid de 4 accesos rápidos visuales

**Problema:** El espacio central de la pantalla está vacío hasta que el huésped escribe algo. Es la primera impresión del producto y actualmente transmite "pantalla rota".

**Solución:** Una cuadrícula 2×2 de cards visuales con las 4 preguntas más frecuentes de cualquier alojamiento vacacional. Al pulsar una card, se envía la pregunta automáticamente al chat — misma funcionalidad que las pills pero más visual y con más presencia.

**Archivo a crear:** `components/guest/QuickAccessGrid.tsx`

```tsx
const QUICK_CARDS = [
  {
    title: 'WiFi y acceso',
    sub: 'Clave y código puerta',
    bg: 'bg-[#E1F5EE]',
    iconColor: 'text-[#0F6E56]',
    question: '¿Cuál es la contraseña del WiFi y el código de acceso al apartamento?'
  },
  {
    title: 'Check-in / out',
    sub: 'Horarios y normas',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    question: '¿A qué hora es el check-in y el check-out? ¿Cuáles son las normas principales?'
  },
  {
    title: 'Electrodomésticos',
    sub: 'Guías en 3D',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-700',
    question: '¿Qué electrodomésticos hay en el apartamento y cómo funcionan?'
  },
  {
    title: 'Emergencias',
    sub: 'Teléfonos urgentes',
    bg: 'bg-red-50',
    iconColor: 'text-red-600',
    question: '¿Cuál es el teléfono de emergencias y el número del anfitrión?'
  },
]

export function QuickAccessGrid({ onCardClick }: { onCardClick: (q: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-white flex-shrink-0">
      {QUICK_CARDS.map(card => (
        <button
          key={card.title}
          onClick={() => onCardClick(card.question)}
          className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left
                     active:scale-95 transition-transform hover:border-[#1D9E75]
                     hover:bg-[#f0fdf4]"
        >
          <div className={`w-7 h-7 ${card.bg} rounded-lg flex items-center
                          justify-center mb-2`}>
            {/* icono según categoría */}
          </div>
          <p className="text-xs font-medium text-gray-900 leading-tight">{card.title}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
        </button>
      ))}
    </div>
  )
}
```

**Las cards desaparecen** en cuanto el huésped escribe su primera pregunta — se ocultan para dar espacio al chat:

```tsx
// En page.tsx
const [chatStarted, setChatStarted] = useState(false)

const handleSend = (msg: string) => {
  setChatStarted(true)
  // ... lógica de envío
}

{!chatStarted && <QuickAccessGrid onCardClick={handleQuickQuestion} />}
```

**Tiempo estimado:** 45 minutos

- [ ] Crear `components/guest/QuickAccessGrid.tsx` con los 4 cards
- [ ] Añadir estado `chatStarted` en `page.tsx` para ocultar las cards al iniciar conversación
- [ ] Importar los iconos correctos (LockIcon, ClockIcon, CubeIcon, PhoneIcon) de lucide-react

---

### Cambio 4 — Pills de sugerencias horizontales deslizables

**Problema:** Las preguntas sugeridas actuales están apiladas verticalmente y ocupan mucho espacio. En el móvil real se ven como 3 botones grandes apilados que empujan el input hacia abajo.

**Solución:** Convertirlas en una fila horizontal con scroll horizontal, compactas como chips. Ocupan una sola línea de ~40px en lugar de ~150px.

**Archivo a editar:** El componente donde están las pills actuales (probablemente en `page.tsx` o `ChatInput.tsx`)

```tsx
// ANTES — apiladas verticalmente, mucho espacio
<div className="flex flex-col gap-2 p-3">
  <button>¿Cuál es la contraseña del WiFi?</button>
  <button>¿Cómo enciendo el aire acondicionado?</button>
  <button>¿A qué hora es el check-out?</button>
  <button>¿Dónde tiro la basura?</button>
</div>

// DESPUÉS — fila horizontal deslizable, una línea
<div className="flex gap-2 overflow-x-auto px-3 py-2 bg-white
                border-t border-gray-100 flex-shrink-0
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]
                [scrollbar-width:none]">
  {QUICK_PILLS.map(pill => (
    <button
      key={pill}
      onClick={() => onPillClick(pill)}
      className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full
                 border border-gray-200 text-gray-600 bg-white flex-shrink-0
                 active:bg-[#E1F5EE] active:border-[#1D9E75] active:text-[#0F6E56]
                 transition-colors"
    >
      {pill}
    </button>
  ))}
</div>
```

**Pills sugeridas (más cortas y directas):**
```tsx
const QUICK_PILLS = [
  '¿Cuál es el WiFi?',
  '¿A qué hora el check-out?',
  '¿Cómo funciona la lavadora?',
  '¿Dónde tiro la basura?',
  '¿Hay parking?',
  '¿Cómo funciona la calefacción?',
]
```

**Tiempo estimado:** 20 minutos

- [ ] Cambiar el contenedor de pills de `flex-col` a `flex overflow-x-auto`
- [ ] Añadir `whitespace-nowrap` y `flex-shrink-0` a cada pill
- [ ] Ocultar scrollbar con CSS (`scrollbar-width: none`)
- [ ] Acortar los textos de las pills (máx 25 caracteres)

---

### Cambio 5 — Botón "Ver modelo 3D" en respuestas del chat

**Problema:** El visor Three.js existe pero el huésped no tiene ninguna forma de abrirlo desde el chat. La conexión entre "Hestia responde sobre un electrodoméstico" y "ver el modelo 3D" no existe en la UI actual.

**Solución:** Cuando Gemini responde sobre un electrodoméstico que tiene GLB subido, añade un botón "Ver modelo 3D" al final de la burbuja de respuesta.

**Paso 1 — Modificar el prompt del sistema para que Gemini indique el electrodoméstico:**

```ts
// En tu API de chat (app/api/chat/route.ts o similar)
const systemPrompt = `
  ...tu prompt actual...

  IMPORTANTE: Cuando respondas sobre un electrodoméstico específico de esta propiedad,
  añade al FINAL de tu respuesta, en una línea separada, exactamente esto:
  [APPLIANCE_ID:uuid-del-electrodomestico]
  
  Lista de electrodomésticos de esta propiedad con sus IDs:
  ${appliances.map(a => `- ${a.name} (${a.brand}): ${a.id} — tiene modelo 3D: ${!!a.glb_url}`).join('\n')}
`
```

**Paso 2 — Parsear la respuesta en el frontend:**

```tsx
// utils/parseGeminiResponse.ts
export function parseResponse(raw: string) {
  const match = raw.match(/\[APPLIANCE_ID:([^\]]+)\]/)
  return {
    text: raw.replace(/\[APPLIANCE_ID:[^\]]+\]/, '').trim(),
    applianceId: match?.[1] ?? null,
  }
}
```

**Paso 3 — Mostrar el botón en la burbuja:**

```tsx
// components/guest/ChatMessage.tsx
export function ChatMessage({ message, appliances }) {
  const { text, applianceId } = parseResponse(message.content)
  const appliance = appliances.find(a => a.id === applianceId)
  const hasModel = !!appliance?.glb_url

  return (
    <div className="flex gap-2 items-start">
      <HestiaAvatar />
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-tl-none
                      rounded-xl px-3 py-2.5 max-w-[85%]">
        <p className="text-sm text-gray-800 leading-relaxed">{text}</p>

        {applianceId && hasModel && (
          <button
            onClick={() => openViewer(applianceId)}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5
                       bg-[#1a3a2e] rounded-lg text-[11px] text-[#9FE1CB]
                       font-medium"
          >
            <CubeIcon className="w-3 h-3" />
            Ver modelo 3D
          </button>
        )}
      </div>
    </div>
  )
}
```

**Tiempo estimado:** 1.5-2 horas (incluye modificación del prompt + parser + UI)

- [ ] Modificar el system prompt en `app/api/chat/route.ts` para inyectar lista de electrodomésticos con IDs
- [ ] Crear `utils/parseGeminiResponse.ts` con la función `parseResponse()`
- [ ] Actualizar `components/guest/ChatMessage.tsx` para mostrar el botón condicionalmente
- [ ] Conectar el botón con `openViewer(applianceId)` — abre el modal Three.js existente

---

### Resumen de cambios — vista del huésped

| Cambio | Archivo principal | Tiempo |
|---|---|---|
| Eliminar pestañas | `app/guest/[propertyId]/page.tsx` | 20 min |
| Banner bienvenida compacto | `components/guest/WelcomeBanner.tsx` (nuevo) | 15 min |
| Grid accesos rápidos | `components/guest/QuickAccessGrid.tsx` (nuevo) | 45 min |
| Pills horizontales | componente pills existente | 20 min |
| Botón "Ver 3D" en chat | `app/api/chat/route.ts` + `ChatMessage.tsx` | 2h |
| **Total** | | **~4 horas** |

---

## Mejoras añadidas sobre el cronograma original

| Mejora | Motivo |
|---|---|
| Supabase Auth + RLS | Seguridad real: cada anfitrión aislado |
| RAG sobre PDFs | El asistente responde con los manuales reales |
| Generación de QR | Completa el flujo de uso real en el alojamiento |
| Notificaciones email | El anfitrión no necesita estar mirando el dashboard |
| Supabase Realtime | Dashboard vivo sin recargar |
| Métricas ESG | Argumento de impacto para el tribunal |
| Visor 3D de electrodomésticos | Diferenciador único, ningún competidor lo tiene |
| Multiidioma automático | Clave para anfitriones con huéspedes internacionales |
| Fix métricas clicables | UX básica del dashboard — navegación desde KPIs |
| Fix texto crudo PDF | Profesionalidad de la UI — ocultar datos internos |
| Fix etiquetas en español | Consistencia de idioma en toda la interfaz |
| Fix notas en incidencias | El anfitrión puede dejar historial y responder al huésped |
| Fix filtro de incidencias | Escalabilidad — imprescindible con 20+ incidencias |
| Fix validación placeholders | Evita instrucciones incompletas visibles para el huésped |
| Fix URL QR en producción | Crítico — sin esto el QR no funciona fuera de localhost |
| Fix estado de propiedad | Visibilidad operativa — activa / ocupada / inactiva |
| Fix nombres duplicados | Integridad de datos — evitar confusión entre propiedades |
| Fix login robusto | Doble-click bloqueado + recuperación de contraseña |
| Subida de GLB al formulario | Cierra el flujo escaneo → modelo → visor Three.js |
| Guía de escaneo in-app | El anfitrión sabe exactamente cómo fotografiar — reduce GLBs de mala calidad |
| Hotspots sobre el modelo 3D | Diferenciador real — señalar botones exactos en el electrodoméstico real |
| Rediseño vista huésped | Elimina vacío central, añade cards rápidas, pills horizontales, botón Ver 3D |