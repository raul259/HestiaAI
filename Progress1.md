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

## Sección 8: Flujo 3D — Subida de GLB y guía de escaneo

> Antes del **15/04** — conecta el escaneo 3D con el visor Three.js ya construido

---

### Feature 1 — Formulario de subida de electrodoméstico con GLB

**Qué es:** Ampliar el formulario actual de "Añadir electrodoméstico" para que el anfitrión pueda subir tanto el PDF del manual como el archivo GLB del modelo 3D, todo en el mismo flujo en 3 pasos.

**Decisión de diseño — Flujo externo (MVP):**
El anfitrión genera el GLB fuera de Hestia IA usando KIRI Engine en su móvil, y lo sube al formulario. Hestia IA solo recibe el archivo final. Simple, sin dependencias de API de pago, válido para el tribunal.

La integración directa de fotogrametría dentro de la app (llamar a la API de KIRI Engine) queda como **roadmap post-lanzamiento**.

**Archivos a crear:**

```
app/host/properties/[id]/appliances/new/page.tsx   ← formulario 3 pasos
app/api/appliances/route.ts                         ← endpoint POST
app/api/appliances/upload-glb/route.ts              ← subida a Supabase Storage
lib/supabase/storage.ts                             ← helpers de storage
```

**Migración de BD — añadir a la tabla `appliances`:**

```sql
ALTER TABLE appliances
  ADD COLUMN glb_url TEXT,
  ADD COLUMN glb_size_bytes INTEGER,
  ADD COLUMN glb_uploaded_at TIMESTAMPTZ;
```

**Crear bucket en Supabase Storage:**
- Nombre: `appliance-models`
- Acceso: privado (solo anfitriones autenticados vía RLS)

**Helper de subida:**

```ts
// lib/supabase/storage.ts
export async function uploadGLB(file: File, propertyId: string, applianceId: string) {
  const supabase = createClient()
  const fileName = `${propertyId}/${applianceId}/model.glb`

  await supabase.storage.from('appliance-models').upload(fileName, file, {
    contentType: 'model/gltf-binary',
    upsert: true,
  })

  const { data: signed } = await supabase.storage
    .from('appliance-models')
    .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 año

  return { url: signed!.signedUrl, sizeBytes: file.size }
}
```

**Endpoint POST `/api/appliances`:**

```ts
// Recibe FormData con: name, brand, location, category, propertyId, pdf (File), glb (File?)
// 1. Crea registro en BD
// 2. Procesa PDF con el RAG existente (pdf-parse)
// 3. Si existe glb → valida tamaño (max 50MB) y extensión → sube con uploadGLB() → guarda glb_url en BD
```

**Validaciones del GLB:**
- Tamaño máximo: 50 MB
- Extensiones válidas: `.glb`, `.gltf`
- Mensaje de error en español si falla

**Conexión con Three.js (ya construido):**

```ts
// En el componente visor — reemplazar URL estática por la de Supabase
const { data: appliance } = await supabase
  .from('appliances').select('glb_url').eq('id', applianceId).single()

loader.load(appliance.glb_url, (gltf) => scene.add(gltf.scene))
// glb_url es una URL HTTPS firmada — GLTFLoader la carga sin cambios
```

**Estados del formulario (3 pasos):**
1. Datos del electrodoméstico (nombre, marca, ubicación, categoría)
2. Manual PDF — drop zone — obligatorio
3. Modelo 3D GLB — drop zone — opcional, puede añadirse después

**UX importante:**
- El botón "Guardar" se desactiva hasta que haya nombre + PDF
- El GLB es opcional — si no se sube, el asistente funciona solo con el PDF
- Mensaje de confirmación: "Manual procesado ✓ · Modelo 3D cargado ✓"

**Tiempo estimado:** 3-4 horas

- [ ] Migración SQL — columnas `glb_url`, `glb_size_bytes`, `glb_uploaded_at`
- [ ] Crear bucket `appliance-models` en Supabase Storage con RLS
- [ ] `lib/supabase/storage.ts` — helper `uploadGLB()`
- [ ] `app/api/appliances/route.ts` — endpoint POST con validaciones
- [ ] `app/host/properties/[id]/appliances/new/page.tsx` — formulario 3 pasos con drop zones
- [ ] Conectar `glb_url` de BD con `GLTFLoader` en el visor Three.js existente

---

### Feature 2 — Guía de escaneo para el anfitrión (stepper in-app)

**Qué es:** Un modal o página guiada de 5 pasos dentro de Hestia IA que explica al anfitrión exactamente cómo fotografiar el electrodoméstico con su móvil para generar el GLB con KIRI Engine. Se abre desde el formulario al pulsar "¿Cómo obtengo el modelo 3D?".

**Por qué incluirlo:** El anfitrión no es técnico. Sin guía, muchos no sabrán que tienen que dar 3 vueltas al objeto, solapar las fotos al 70%, o que no deben hacer zoom. Una guía clara dentro de la app reduce el número de GLBs de mala calidad que se suben, y diferencia Hestia IA de soluciones que simplemente piden "sube un archivo".

**Ruta:** Modal accesible desde el botón "¿Cómo obtengo el modelo 3D?" en el Paso 3 del formulario.

**Contenido de los 5 pasos:**

| Paso | Título | Contenido clave |
|------|--------|-----------------|
| 1 | Elige la app | KIRI Engine (recomendada, Android+iOS, gratis) · Scaniverse (alternativa) |
| 2 | Prepara el electrodoméstico | Buena luz · espacio libre · puertas cerradas · superficie limpia · truco superficie brillante |
| 3 | Fotografía el objeto | 40-60 fotos · 3 alturas · 70% solapamiento · sin zoom · incluir panel de control |
| 4 | Genera el modelo en KIRI Engine | Photo Scan → subir fotos → procesar → exportar como **GLB** |
| 5 | Sube el GLB a Hestia IA | Drop zone del formulario → después añadir puntos de interés |

**Implementación:**

```tsx
// components/ScanGuideModal.tsx
// Modal con stepper de 5 pasos
// Navegación: Anterior / Siguiente
// Último paso tiene botón "Ir al formulario" que cierra el modal

export function ScanGuideModal({ open, onClose }) {
  const [step, setStep] = useState(0)
  const steps = [/* array de 5 objetos con título, descripción, contenido */]

  return (
    <Modal open={open} onClose={onClose}>
      <ProgressDots total={5} current={step} />
      <StepContent step={steps[step]} />
      <nav>
        {step > 0 && <button onClick={() => setStep(s => s-1)}>Anterior</button>}
        {step < 4
          ? <button onClick={() => setStep(s => s+1)}>Siguiente</button>
          : <button onClick={onClose}>Ir al formulario</button>
        }
      </nav>
    </Modal>
  )
}
```

**Tiempo estimado:** 2 horas

- [ ] `components/ScanGuideModal.tsx` — stepper de 5 pasos con contenido e ilustraciones
- [ ] Botón "¿Cómo obtengo el modelo 3D?" en el Paso 3 del formulario que abre el modal
- [ ] Ilustración de la órbita de fotos (SVG simple — cámara girando alrededor del objeto)

---

### Feature 3 — Puntos de interés (hotspots) sobre el modelo 3D

**Qué es:** Después de subir el GLB, el anfitrión puede marcar puntos específicos sobre el modelo 3D — por ejemplo, señalar exactamente qué botón pulsar en el panel del termo, o dónde está el selector de temperatura. Estos puntos aparecen como marcadores rojos en el visor del huésped.

**Por qué es el diferenciador real:** Cualquier chatbot puede decir "pulsa el botón rojo de la derecha". Hestia IA puede mostrar exactamente ese botón en el modelo 3D del electrodoméstico real de ese apartamento, señalado con un marcador interactivo. Ningún competidor tiene esto.

**Flujo:**
1. Anfitrión sube el GLB → el visor Three.js lo carga
2. El anfitrión hace click sobre el modelo en un "modo edición" → se crea un hotspot en esas coordenadas 3D
3. El anfitrión añade una etiqueta al hotspot ("Botón de encendido", "Selector de temperatura", etc.)
4. Los hotspots se guardan en BD como coordenadas 3D + etiqueta
5. En la vista del huésped, los hotspots aparecen como esferas rojas clicables con tooltip

**Estructura de datos:**

```sql
CREATE TABLE appliance_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id UUID REFERENCES appliances(id) ON DELETE CASCADE,
  label TEXT NOT NULL,           -- "Botón de encendido"
  position_x FLOAT NOT NULL,     -- coordenada Three.js
  position_y FLOAT NOT NULL,
  position_z FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementación Three.js (modo edición):**

```ts
// Modo edición — anfitrión hace click → crea hotspot
renderer.domElement.addEventListener('click', (e) => {
  if (!editMode) return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    const point = intersects[0].point  // Vector3 con coordenadas 3D exactas
    // Mostrar input para que el anfitrión etiquete el punto
    setNewHotspot({ x: point.x, y: point.y, z: point.z })
    setShowLabelInput(true)
  }
})

// Guardar hotspot en BD
const saveHotspot = async (label: string, position: Vector3) => {
  await fetch('/api/appliances/hotspots', {
    method: 'POST',
    body: JSON.stringify({ applianceId, label, ...position })
  })
}
```

**Vista del huésped — renderizar hotspots:**

```ts
// Cargar hotspots de BD y añadirlos como esferas al modelo
const hotspots = await fetchHotspots(applianceId)

hotspots.forEach(h => {
  const geometry = new THREE.SphereGeometry(0.02, 16, 16)
  const material = new THREE.MeshBasicMaterial({ color: 0xe24b4a })  // rojo
  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(h.position_x, h.position_y, h.position_z)
  sphere.userData = { label: h.label }
  scene.add(sphere)
})

// Al hacer click sobre una esfera → mostrar tooltip con h.label
```

**Ya tienes el raycasting implementado** — este feature reutiliza directamente tu código existente de Three.js.

**Tiempo estimado:** 4-6 horas (incluye BD + API + UI modo edición + renderizado en vista huésped)

- [ ] Migración SQL — tabla `appliance_hotspots`
- [ ] `app/api/appliances/hotspots/route.ts` — GET (listar) y POST (crear)
- [ ] Modo edición en el visor Three.js — click sobre modelo crea hotspot temporal
- [ ] Input de etiqueta flotante sobre el canvas al crear hotspot
- [ ] Renderizado de hotspots como esferas rojas en vista del huésped
- [ ] Tooltip al hacer click/hover sobre hotspot con la etiqueta del anfitrión
- [ ] Opción de eliminar hotspot en modo edición

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