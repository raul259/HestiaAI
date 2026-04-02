# HestiaAI — Documentación técnica para el tribunal

## 1. ¿Qué es HestiaAI?

Asistente virtual con IA para huéspedes de alojamientos vacacionales. El huésped escanea un QR al llegar al piso y accede a un chat que responde sus dudas 24/7 (electrodomésticos, WiFi, check-out, incidencias) usando los datos exactos de esa propiedad.

**Problema que resuelve:** El anfitrión recibe llamadas a las 3am por cosas como "¿cómo pongo el aire acondicionado en modo frío?". HestiaAI elimina esas interrupciones y mejora la experiencia del huésped.

---

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + rutas API integradas |
| Estilos | Tailwind CSS | Utilidades, diseño rápido |
| Base de datos | PostgreSQL (Supabase) | Relacional, gratuito, Auth integrado |
| ORM | Prisma | Type-safe, migraciones sencillas |
| IA | Google Gemini 2.5 Flash | Rápido, barato, multiidioma |
| Autenticación | Supabase Auth | JWT + cookies, sin implementar crypto propio |
| Email | Resend | API simple, 3000 emails/mes gratis |
| QR | qrcode (npm) | Genera canvas descargable como PNG |
| PDF | pdf-parse (npm) | Extrae texto de manuales PDF |
| 3D Landing | Three.js | Escena interactiva en la página de inicio |

---

## 3. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────┐
│                  NEXT.JS APP                        │
│                                                     │
│  /auth/*          /host/*          /guest/*         │
│  Login            Dashboard        Chat IA          │
│  Registro         Propiedades      Incidencias      │
│                   QR Code                           │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              API ROUTES (/api/*)             │   │
│  │  properties  appliances  incidents  chat     │   │
│  │  upload-manual                               │   │
│  └──────────────────────────────────────────────┘   │
└────────────┬────────────────┬───────────────────────┘
             │                │
    ┌────────▼──────┐  ┌──────▼────────┐
    │   Supabase    │  │  Gemini API   │
    │  PostgreSQL   │  │  (Google AI)  │
    │  Auth + JWT   │  └───────────────┘
    └───────────────┘
             │
    ┌────────▼──────┐
    │    Resend     │
    │  (Emails)     │
    └───────────────┘
```

---

## 4. Modelo de datos (Prisma schema)

### Property
Representa un alojamiento. Cada anfitrión puede tener varias propiedades.

```
Property {
  id            String   — ID único (CUID)
  hostId        String   — UUID del anfitrión en Supabase Auth
  name          String   — Nombre del alojamiento
  address       String   — Dirección
  description   String?  — Descripción libre
  wifiName      String?  — SSID del WiFi
  wifiPassword  String?  — Contraseña WiFi
  checkoutInstructions String? — Instrucciones de salida
  wasteInstructions    String? — Dónde tirar la basura
  emergencyContact     String? — Teléfono de emergencias
  hostName      String   — Nombre visible del anfitrión
  hostEmail     String   — Email al que llegan las notificaciones
  accessCode    String?  — Código de acceso (uso futuro)

  → appliances[]    — Electrodomésticos de esta propiedad
  → incidents[]     — Incidencias reportadas
  → conversations[] — Historial de chats
}
```

### Appliance
Electrodoméstico con su manual de instrucciones.

```
Appliance {
  id         String  — ID único
  propertyId String  — A qué propiedad pertenece
  name       String  — Nombre (ej: "Aire acondicionado")
  model      String? — Modelo exacto (ej: "Daikin FTXM35R")
  category   String  — Tipo (tv, ac, washer, oven, wifi...)
  manual     String  — Texto del manual (extraído de PDF o escrito a mano)
  location   String? — Dónde está en el piso (ej: "Salón")
}
```

### Incident
Incidencia reportada por un huésped.

```
Incident {
  id          String    — ID único
  propertyId  String    — A qué propiedad pertenece
  title       String    — Título del problema
  description String    — Descripción detallada
  category    String    — electricity | water | wifi | appliance | access | other
  status      String    — open | in_progress | resolved | closed
  priority    String    — low | medium | high | urgent
  guestName   String?   — Nombre del huésped (opcional)
  guestEmail  String?   — Email del huésped (opcional)
  scheduledAt DateTime? — Franja horaria propuesta para técnico
  createdAt   DateTime
}
```

### Conversation
Historial de mensajes del chat por sesión.

```
Conversation {
  id         String — ID único
  propertyId String — Qué propiedad
  sessionId  String — ID de sesión del navegador (generado en cliente)
  messages   String — JSON stringificado con el array de mensajes
}
```

---

## 5. Flujo de autenticación (anfitriones)

```
Usuario → /auth/register → Supabase crea usuario → Email de confirmación
Usuario → /auth/login → Supabase Auth → JWT en cookie
middleware.ts → verifica JWT en cada petición a /host/*
→ Si no hay JWT válido → redirige a /auth/login
→ Si hay JWT → permite acceso
```

**Archivos clave:**
- `src/middleware.ts` — Intercepta todas las rutas `/host/*` y `/auth/*`
- `src/lib/supabase/client.ts` — Cliente Supabase para el navegador
- `src/lib/supabase/server.ts` — Cliente Supabase para el servidor (Server Components)
- `src/app/auth/login/page.tsx` — Formulario de login
- `src/app/auth/register/page.tsx` — Formulario de registro
- `src/app/auth/callback/route.ts` — Maneja el redirect tras confirmar email

---

## 6. Flujo del chat IA (parte más importante)

```
1. Huésped escribe mensaje en /guest/{propertyId}
2. ChatInterface.tsx → POST /api/chat con {propertyId, sessionId, messages}
3. API carga la propiedad desde BD (con todos sus electrodomésticos y manuales)
4. buildSystemPrompt() construye un prompt con:
   - Nombre y descripción del alojamiento
   - WiFi, instrucciones de checkout, residuos, emergencias
   - Manuales completos de todos los electrodomésticos
5. Se llama a Gemini 2.5 Flash con el system prompt + historial de mensajes
6. Gemini responde en el idioma del huésped
7. La conversación se guarda en BD
8. Se devuelve la respuesta al cliente
```

**Por qué funciona bien:** El LLM no "inventa" — tiene el manual exacto del electrodoméstico exacto de esa propiedad inyectado en el contexto. Si no tiene información, lo dice.

**Archivo clave:** `src/app/api/chat/route.ts`

---

## 7. Extracción de manuales PDF

```
Anfitrión → sube PDF en ApplianceSection
→ POST /api/upload-manual (multipart/form-data)
→ pdf-parse extrae el texto del PDF en el servidor
→ Devuelve el texto al cliente
→ El texto rellena automáticamente el campo "manual"
→ El anfitrión puede editarlo antes de guardar
→ Al guardar, el texto va a Appliance.manual en BD
→ En el próximo chat, ese texto estará en el system prompt de Gemini
```

**Archivos clave:**
- `src/app/api/upload-manual/route.ts` — Endpoint de extracción
- `src/components/host/ApplianceSection.tsx` — UI con botón "Subir PDF"

---

## 8. Notificaciones por email (doble flujo)

### 8a. Email al anfitrión (cuando llega una incidencia)
```
Huésped reporta incidencia → POST /api/incidents
→ Se crea la incidencia en BD
→ Se busca el hostEmail de la propiedad
→ enviarEmailIncidencia() llama a Resend API
→ Email llega al anfitrión con:
   - Nombre de la propiedad
   - Título y descripción del problema
   - Categoría y prioridad (con colores)
   - Datos del huésped (si los dejó)
   - Franja horaria propuesta (si la seleccionó)
   - Botón "Ver en el panel"
→ La respuesta al huésped NO espera al email (Promise sin await)
```

### 8b. Email al huésped (cuando se resuelve)
```
Anfitrión pulsa "Resolver" → PATCH /api/incidents { status: "resolved" }
→ Si incident.guestEmail existe:
   → enviarEmailResolucion() llama a Resend API
   → Email al huésped con:
      - Confirmación visual (checkmark verde)
      - Nombre de la incidencia resuelta
      - Mensaje del anfitrión con opción de re-reportar
→ No bloquea la respuesta HTTP (.catch() solamente)
```

**Archivos clave:**
- `src/lib/email.ts` — Dos funciones: `enviarEmailIncidencia()` y `enviarEmailResolucion()`
- `src/app/api/incidents/route.ts` — POST dispara email al anfitrión, PATCH dispara email al huésped

---

## 9. Generación de QR

```
/host/properties/{id} → QRCodeCard.tsx
→ useEffect genera QR con la librería qrcode
→ Renderiza en <canvas> con colores de marca (#1B3022 y blanco)
→ Botón "Descargar PNG" → canvas.toDataURL() → descarga automática
```

**La URL del QR apunta a:** `{dominio}/guest/{propertyId}`

Un QR por propiedad. Todos los huéspedes de esa propiedad usan el mismo QR. El anfitrión lo imprime y lo coloca físicamente en el alojamiento.

**Archivo clave:** `src/components/host/QRCodeCard.tsx`

---

## 10. Dashboard en tiempo real (Supabase Realtime)

```
Anfitrión abre /host/dashboard
→ RealtimeIncidents.tsx monta y crea canal Supabase Realtime
→ Suscripción a postgres_changes:
   - INSERT en tabla Incident → nueva tarjeta aparece con borde verde 6s + "Nueva incidencia"
   - UPDATE en tabla Incident → cambia el estado de la tarjeta sin recargar
→ Indicador visual: punto verde pulsante + "En vivo" (conectado) / gris "Conectando…"
→ Filtro: solo muestra incidencias de propiedades del anfitrión autenticado

Configuración necesaria en Supabase:
→ Database → Publications → supabase_realtime → añadir tabla Incident
```

**Por qué funciona:** Supabase Realtime usa replicación lógica de PostgreSQL (WAL). Cuando Prisma hace un INSERT/UPDATE, el cambio viaja por WebSocket al navegador del anfitrión en ~100ms.

**Archivo clave:** `src/components/host/RealtimeIncidents.tsx`

---

## 11. Seguimiento de incidencias por el huésped

El huésped no tiene cuenta, pero puede ver el estado de sus incidencias gracias a `localStorage`.

```
Huésped reporta incidencia:
→ IncidentForm.tsx → POST /api/incidents → respuesta incluye { id, ... }
→ El ID se guarda en localStorage["hestia_incidents_{propertyId}"]
→ onIncidentCreated() callback:
   → incrementa badge del tab
   → cierra el modal
   → cambia al tab "Mis incidencias"

Tab "Mis incidencias" (GuestIncidents.tsx):
→ Lee IDs de localStorage
→ GET /api/incidents?ids=id1,id2,... → carga estado actual
→ Suscripción Realtime a UPDATE en Incident
   → Si el ID del evento está en los IDs del huésped → actualiza estado
   → Si nuevo estado = "resolved" → destaca en verde 8s con mensaje "¡Resuelta!"
```

**Estados del ciclo de vida:**
| Estado | Color | Icono | Significado |
|---|---|---|---|
| open | Naranja | ⏳ | Pendiente de atención |
| in_progress | Azul | 🔧 | El anfitrión está actuando |
| resolved | Verde | ✓ | Problema solucionado |
| closed | Gris | ✓ | Archivado |

**Archivos clave:**
- `src/components/guest/GuestIncidents.tsx` — Componente del tab
- `src/components/guest/IncidentForm.tsx` — Guarda ID en localStorage al crear

---

## 12. Estructura de carpetas

```
src/
├── app/
│   ├── api/                    ← Rutas API (backend)
│   │   ├── chat/               ← POST: Chat con Gemini
│   │   ├── properties/         ← CRUD propiedades
│   │   ├── appliances/         ← CRUD electrodomésticos
│   │   ├── incidents/          ← CRUD incidencias + emails
│   │   └── upload-manual/      ← POST: Extracción de texto PDF
│   ├── auth/
│   │   ├── login/              ← Página de login
│   │   ├── register/           ← Página de registro
│   │   └── callback/           ← Redirect tras confirmar email
│   ├── host/
│   │   ├── dashboard/          ← Panel principal del anfitrión
│   │   └── properties/
│   │       ├── [id]/           ← Detalle de propiedad + QR
│   │       └── new/            ← Crear nueva propiedad
│   └── guest/
│       └── [propertyId]/       ← Interfaz del huésped (chat + info + incidencias)
├── components/
│   ├── host/
│   │   ├── ApplianceSection    ← Gestión electrodomésticos + PDF
│   │   ├── IncidentList        ← Lista de incidencias con acciones (propiedad)
│   │   ├── RealtimeIncidents   ← Incidencias en vivo en el dashboard
│   │   ├── LogoutButton        ← Botón cerrar sesión (client)
│   │   └── QRCodeCard          ← Generador de QR descargable
│   ├── guest/
│   │   ├── ChatInterface       ← Chat con IA
│   │   ├── IncidentForm        ← Modal reportar incidencia
│   │   └── GuestIncidents      ← Tab seguimiento de incidencias del huésped
│   └── landing/
│       ├── Navbar, Features, HowItWorks, HeroScene
└── lib/
    ├── supabase/
    │   ├── client.ts           ← Supabase para navegador (Realtime, auth)
    │   └── server.ts           ← Supabase para servidor (Server Components)
    ├── email.ts                ← enviarEmailIncidencia() + enviarEmailResolucion()
    ├── gemini.ts               ← Cliente Gemini
    └── prisma.ts               ← Singleton Prisma
```

---

## 13. Variables de entorno necesarias

```env
DATABASE_URL          — Connection string de Supabase PostgreSQL (Session Pooler)
GEMINI_API_KEY        — API key de Google AI Studio
NEXT_PUBLIC_SUPABASE_URL      — URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY — Clave pública de Supabase
RESEND_API_KEY        — API key de Resend para emails
NEXT_PUBLIC_APP_URL   — URL base de la app (http://localhost:3000 en dev)
```

---

## 14. Seguridad implementada

| Medida | Dónde |
|---|---|
| Autenticación JWT via Supabase Auth | middleware.ts |
| Cada anfitrión solo ve sus propiedades | hostId en todas las queries |
| APIs de escritura verifican sesión antes de actuar | /api/properties, /api/properties/[id] |
| La vista de huésped es de solo lectura (sin auth) | Por diseño — no hay datos sensibles expuestos |
| Passwords nunca se guardan en nuestra BD | Supabase Auth los gestiona |

---

## 15. Estado del cronograma

| Funcionalidad | Fecha | Estado |
|---|---|---|
| Migración PostgreSQL (Supabase) | — | ✅ Hecho |
| Autenticación anfitriones (Supabase Auth) | — | ✅ Hecho |
| CRUD propiedades / electrodomésticos / incidencias | — | ✅ Hecho |
| Chat IA con Gemini (RAG sobre manuales) | — | ✅ Hecho |
| Extracción texto PDF (pdf-parse) | — | ✅ Hecho |
| Generación QR por propiedad | 08/04 | ✅ Hecho |
| Emails al anfitrión al crear incidencia | — | ✅ Hecho |
| Email al huésped al resolver incidencia | — | ✅ Hecho |
| Realtime dashboard (Supabase Realtime) | 16/04 | ✅ Hecho |
| Tab "Mis incidencias" para el huésped | — | ✅ Hecho |
| Chat → botón "Ver en 3D" | — | ✅ Hecho |
| Foto adjunta en incidencias (Gemini Vision) | — | ✅ Hecho |
| Categorización automática de incidencias | — | ✅ Hecho |
| Dashboard ESG (CO₂, visitas, resolución) | 26/04 | ✅ Hecho |
| Analytics preguntas frecuentes | — | ✅ Hecho |
| Subida de GLB a Supabase Storage | — | ✅ Hecho |
| Guía de escaneo 3D (ScanGuideModal) | — | ✅ Hecho |
| Hotspots sobre modelo 3D | — | ✅ Hecho |
| Three.js avanzado (raycasting) | 12/04 | ⏳ Pendiente |
| Despliegue en producción (Vercel) | Antes de demo | ⏳ Pendiente |
| Vídeo demo | 02/05 | ⏳ Pendiente |
| **Presentación tribunal** | **04/05** | — |
| Entrega final | 11/05 | — |

---

## 16. Preguntas frecuentes del tribunal

**¿Por qué Next.js y no Express + React separados?**
Next.js unifica frontend y backend en un solo proyecto. Las API Routes actúan como un servidor Express ligero. Para un equipo pequeño reduce la complejidad de infraestructura.

**¿Por qué Gemini y no ChatGPT?**
Gemini 2.5 Flash tiene mayor contexto (1M tokens), lo que permite inyectar manuales extensos completos. Además tiene tier gratuito generoso para desarrollo.

**¿Cómo evita el LLM inventarse información?**
El system prompt incluye la instrucción explícita: "Responde SOLO basándote en la información proporcionada. Si no tienes información sobre algo, dilo claramente." Temperatura configurada a 0.4 (poco creativo).

**¿Qué pasa si el PDF está escaneado (imagen)?**
pdf-parse no puede extraer texto de PDFs escaneados sin OCR. En ese caso devuelve un error claro al anfitrión indicando que el PDF no tiene texto extraíble. Solución futura: integrar un servicio de OCR.

**¿Es seguro el QR? ¿Se puede manipular?**
El QR es un enlace público a `/guest/{propertyId}`. No hay credenciales en la URL. El riesgo principal es QR Hijacking (sustituir el QR físico por uno falso). Mitigaciones: HTTPS en producción, no hay datos sensibles en el flujo del huésped, el anfitrión puede laminar el QR.

**¿Por qué SQLite en desarrollo y PostgreSQL en producción?**
Se empezó con SQLite por simplicidad (sin servidor). Al migrar a Supabase, Prisma solo requirió cambiar `provider = "sqlite"` a `provider = "postgresql"` y actualizar la connection string. El schema no cambió.

---

## 17. Mejoras de UX y robustez del panel del anfitrión

Durante la fase de pulido se implementaron 10 correcciones que elevan la calidad del producto:

### Fix 1 — Métricas del dashboard clicables
Las tarjetas de KPIs (propiedades, incidencias abiertas, electrodomésticos) del dashboard eran solo informativas. Se envolvieron en `<Link>` de Next.js con una flecha que aparece al pasar el cursor. Ahora navegan directamente a la sección correspondiente.
**Archivo:** `src/app/host/dashboard/page.tsx`

### Fix 2 — Ocultar texto crudo del PDF
Al expandir un electrodoméstico en el panel del anfitrión se mostraba el texto completo extraído del PDF (cientos de líneas de manual). Se reemplazó por un panel de estado limpio: badge verde "Manual procesado" con el número aproximado de palabras, o badge ámbar "Sin manual" si no se ha subido PDF.
**Archivo:** `src/components/host/ApplianceSection.tsx`

### Fix 3 — Etiquetas de incidencias en español
Los valores de la base de datos (`in_progress`, `urgent`, `resolved`) se mostraban directamente en la UI. Se aplicaron las funciones `getPriorityLabel()` y `getStatusLabel()` que ya existían en `utils.ts` pero no se usaban en `IncidentList.tsx`.
**Archivo:** `src/components/host/IncidentList.tsx`

### Fix 4 — Notas internas y respuesta al huésped
El anfitrión no tenía forma de dejar historial de actuaciones ni comunicarse con el huésped desde el panel. Se añadió un nuevo modelo `IncidentNote` en Prisma con campo `type` (internal | reply). Al expandir una incidencia aparece un campo con dos modos: nota interna (solo visible en el panel) o respuesta al huésped (envía email automático via Resend si el huésped dejó su correo).
**Archivos:** `prisma/schema.prisma`, `src/app/api/incidents/notes/route.ts`, `src/components/host/IncidentList.tsx`, `src/lib/email.ts`

### Fix 5 — Filtro y búsqueda de incidencias
Con múltiples incidencias históricas era difícil encontrar una concreta. Se añadió una barra de búsqueda por texto (título y descripción) y dos selectores de filtro (estado y prioridad) directamente en `IncidentList.tsx` usando `useMemo` para el filtrado reactivo sin llamadas a la API. Muestra un contador de resultados cuando hay filtros activos.
**Archivo:** `src/components/host/IncidentList.tsx`

### Fix 6 — Detección de campos sin completar en instrucciones
Las instrucciones de checkout y residuos pueden contener plantillas con texto sin rellenar como `[Nombre del técnico]`. Si el anfitrión activa el QR sin completarlos, el huésped verá texto genérico. Al hacer submit se detectan patrones `[...]` con regex y se muestra un aviso ámbar bajo el campo afectado con los placeholders exactos encontrados.
**Archivo:** `src/app/host/properties/new/page.tsx`

### Fix 7 — URL del QR en producción
El componente `QRCodeCard` ya usaba `process.env.NEXT_PUBLIC_APP_URL || window.location.origin`. Se verificó la configuración y se añadió la URL de producción `https://hestia-ai.vercel.app` en las variables de entorno de Vercel. En desarrollo sigue apuntando a localhost.
**Archivo:** `src/components/host/QRCodeCard.tsx`, variables de entorno Vercel

### Fix 8 — Estado operativo de la propiedad
El anfitrión no tenía visibilidad del estado de cada alojamiento de un vistazo. Se añadió el campo `status` (String, default "active") al modelo `Property` en Prisma. Se creó el componente `PropertyStatusBadge` con un desplegable para cambiar entre **Activa**, **Con huésped** e **Inactiva**. Los cambios se persisten via `PATCH /api/properties`.
**Archivos:** `prisma/schema.prisma`, `src/components/host/PropertyStatusBadge.tsx`, `src/app/api/properties/route.ts`

### Fix 9 — Validación de nombres duplicados
Era posible crear dos propiedades con el mismo nombre bajo el mismo anfitrión, generando confusión en el panel. En el endpoint `POST /api/properties` se añadió una consulta previa con `findFirst` usando `mode: "insensitive"` (insensible a mayúsculas). Si ya existe una propiedad con ese nombre devuelve HTTP 409 con mensaje de error claro.
**Archivo:** `src/app/api/properties/route.ts`

### Fix 10 — Login robusto con recuperación de contraseña
Dos mejoras en la página de login: (A) el botón de "Entrar" ahora queda deshabilitado con un spinner durante la autenticación, impidiendo doble envío; (B) se añadió el enlace "¿Olvidaste tu contraseña?" que llama a `supabase.auth.resetPasswordForEmail()` — Supabase gestiona el envío del email de recuperación automáticamente, sin configuración adicional.
**Archivo:** `src/app/auth/login/page.tsx`

---

## 18. Chat IA → Botón "Ver en 3D"

Cuando la IA responde mencionando un electrodoméstico, aparece un botón pill debajo de la burbuja para abrirlo directamente en el visor 3D.

```
Huésped pregunta: "¿Cómo pongo la lavadora en modo rápido?"
Gemini responde con instrucciones detalladas
→ ChatInterface ejecuta detectAppliance(respuesta, appliancesDelHost)
→ Si algún nombre de electrodoméstico aparece en el texto de la respuesta:
   → Se renderiza un botón "Ver lavadora en 3D" bajo la burbuja de Gemini
   → Al pulsarlo: onOpenAppliance(appliance) → abre ApplianceModal con Three.js
```

**Implementación técnica:**
- `detectAppliance(text, appliances)` — busca coincidencia de nombre en minúsculas con `Array.find()`
- El botón solo aparece en mensajes del asistente, nunca en los del usuario
- Se usa una IIFE `(() => { ... })()` dentro del JSX para evaluar la detección de forma inline
- `ChatInterface` ya recibe `appliances` y `onOpenAppliance` como props desde `page.tsx`, que los obtiene de `property.appliances`

**Archivos:**
- `src/components/guest/ChatInterface.tsx` — función `detectAppliance()` + botón pill
- `src/app/guest/[propertyId]/page.tsx` — pasa props al ChatInterface

---

## 19. Foto adjunta en incidencias con análisis por IA

El huésped puede adjuntar una foto de la avería al reportar una incidencia. Gemini Vision analiza la imagen y rellena automáticamente el campo descripción.

```
Flujo completo:
1. Huésped pulsa "Adjuntar foto del problema" en IncidentForm
2. Se abre la cámara del móvil (capture="environment") o galería
3. Al seleccionar la imagen:
   → Se muestra preview en miniatura (URL.createObjectURL)
   → Spinner "Analizando imagen con IA..."
   → POST /api/analyze-photo (FormData con el archivo)
4. En el servidor:
   → file.arrayBuffer() → Buffer.toString("base64")
   → Gemini 2.5 Flash Vision con inlineData (mimeType + base64)
   → System prompt: "Describe el problema o avería de forma clara, máximo 3 frases"
   → Temperatura 0.2 (respuestas concretas y directas)
5. La descripción devuelta rellena el textarea automáticamente
6. El huésped puede editarla antes de enviar
```

**Por qué es útil:** El huésped puede hacer una foto sin necesidad de escribir. La IA convierte la imagen en un ticket técnico preciso que el anfitrión puede gestionar directamente.

**Archivos:**
- `src/app/api/analyze-photo/route.ts` — endpoint POST, recibe FormData, llama a Gemini Vision
- `src/components/guest/IncidentForm.tsx` — `handlePhotoUpload()`, preview, estado `analyzing`

---

## 20. Dashboard ESG y Analytics para el anfitrión

### 20a. Métricas ESG

El dashboard del anfitrión muestra 3 KPIs de impacto medioambiental y operativo, calculados en tiempo real desde los datos de incidencias.

| Métrica | Cálculo | Fuente |
|---|---|---|
| CO₂ ahorrado (kg) | incidencias resueltas × 1,2 kg | Cada visita técnica evitada ≈ 5 km en coche (120 g CO₂/km × 2) |
| Visitas técnicas evitadas | COUNT de incidencias con `status = "resolved"` | Tabla `Incident` |
| Tiempo medio de resolución | AVG(`updatedAt − createdAt`) de incidencias resueltas, en horas | Tabla `Incident` |

**Decisión de diseño:** Las incidencias resueltas se consideran "visitas evitadas" porque el sistema de notificación + chat permite al anfitrión gestionar muchos problemas sin desplazarse. Es una métrica orientada a la presentación del impacto del producto.

### 20b. Preguntas frecuentes (Analytics)

El dashboard muestra un ranking de las 5 categorías de preguntas más habituales de los huéspedes, basado en el historial de conversaciones almacenado en BD.

```
Proceso de cálculo (servidor, sin llamadas a la IA):
1. Carga todas las Conversation del anfitrión (campo messages: JSON string)
2. Parsea cada JSON → extrae solo los mensajes con role = "user"
3. Para cada mensaje, detecta categoría por keywords:
   - WiFi / Contraseña  → ["wifi", "contraseña", "internet", "password"...]
   - Check-out / Llaves → ["checkout", "salida", "llave", "hora de salida"...]
   - Check-in / Acceso  → ["checkin", "llegada", "acceso", "código"...]
   - Electrodomésticos  → ["lavadora", "nevera", "horno", "aire"...]
   - Aparcamiento       → ["parking", "aparcamiento", "coche"...]
   - Limpieza / Ropa    → ["limpieza", "toallas", "sábanas"...]
4. Calcula porcentaje de cada categoría sobre el total de mensajes
5. Muestra top 5 con barra de progreso proporcional
```

**Por qué keywords y no IA:** La categorización por keywords es O(n) y se ejecuta en el servidor sin coste de API. Suficiente para MVP y presenta bien ante el tribunal como "análisis de datos propios".

**Archivos:**
- `src/app/host/dashboard/page.tsx` — cálculo ESG + análisis de conversaciones + UI de ambas secciones

---

## 21. Subida de modelos 3D GLB por el anfitrión

El anfitrión puede subir el modelo 3D real de cada electrodoméstico. El flujo es externo (genera el GLB con KIRI Engine en su móvil) e interno (lo sube desde el panel).

```
Anfitrión expande un electrodoméstico en el panel
→ Pulsa "Subir modelo 3D (.glb)"
→ Selecciona el archivo .glb (max 50 MB, solo .glb / .gltf)
→ POST /api/appliances/upload-glb (FormData: glb, applianceId, propertyId)
→ En el servidor:
   1. Validación de tamaño y extensión
   2. file.arrayBuffer() → Supabase Storage (bucket "appliance-models", ruta {propertyId}/{applianceId}/model.glb)
   3. getPublicUrl() → URL pública permanente
   4. prisma.appliance.update({ glbUrl })
→ ApplianceSection actualiza el estado local → badge "Modelo 3D ✓"
→ En el visor del huésped: GLTFLoader carga glbUrl en lugar del modelo genérico por categoría
```

**Decisión de diseño — GLB externo vs integración KIRI Engine:**
Se optó por flujo externo (el anfitrión genera el GLB con su móvil y lo sube). La integración directa de fotogrametría dentro de la app requeriría una API de pago y añade complejidad innecesaria para el MVP del tribunal.

**Infraestructura:**
- Bucket `appliance-models` en Supabase Storage (público — URLs permanentes sin expiración)
- Cliente con `SUPABASE_SERVICE_ROLE_KEY` para bypasear RLS en subidas desde API routes
- Si no hay GLB subido, el visor usa el modelo genérico mapeado por categoría (`/public/models/*.glb`)

**Archivos:**
- `src/app/api/appliances/upload-glb/route.ts` — endpoint POST con validaciones
- `src/lib/supabase/storage.ts` — helper `uploadGLB()` con service_role client
- `src/components/guest/ApplianceViewer.tsx` — `appliance.glbUrl || getModelPath(category)`
- `src/components/host/ApplianceSection.tsx` — botón de subida + badge de estado

---

## 22. Guía de escaneo 3D (ScanGuideModal)

Modal de 5 pasos que explica al anfitrión cómo generar un modelo 3D de calidad con su móvil usando KIRI Engine.

**Por qué es necesaria:** El anfitrión no es técnico. Sin guía, los GLBs resultantes tendrán artefactos (reflejos, geometría rota) porque el usuario no sabe que debe dar 3 vueltas completas, solapar fotos al 70% o evitar el zoom. Una guía clara dentro de la app reduce la fricción y mejora la calidad de los modelos.

**Estructura de los 5 pasos:**

| Paso | Título | Contenido clave |
|---|---|---|
| 1 | Elige la app | KIRI Engine (recomendada, gratis, Android+iOS) · Scaniverse (alternativa iOS) |
| 2 | Prepara el electrodoméstico | Buena luz · espacio libre · puertas cerradas · sin reflejos |
| 3 | Fotografía el objeto | 40-60 fotos · 3 alturas · 70% solapamiento · sin zoom |
| 4 | Genera en KIRI Engine | Photo Scan → procesar → exportar como GLB |
| 5 | Sube a Hestia IA | Drop zone del formulario → badge "Modelo 3D ✓" |

**Acceso:** Botón `?` (HelpCircle) junto al botón "Subir modelo 3D" en el panel del electrodoméstico. Se abre directamente cuando el electrodoméstico aún no tiene GLB.

**Archivo:** `src/components/host/ScanGuideModal.tsx` — stepper con dots de progreso clicables, navegación Anterior/Siguiente, botón "Ir al formulario" en el último paso

---

## 23. Hotspots — Puntos de interés sobre el modelo 3D

El anfitrión puede marcar puntos específicos sobre el modelo 3D de cada electrodoméstico. Los huéspedes ven esos puntos como esferas rojas y al hacer click aparece una etiqueta explicativa.

**Por qué es el diferenciador clave frente a competidores:** Ningún competidor (Enso Connect, Hostfully, Touch Stay) tiene visor 3D. Dentro del propio visor, los hotspots elevan la propuesta de valor — en lugar de decir "pulsa el botón rojo de la derecha", Hestia IA puede señalarlo físicamente en el modelo 3D del electrodoméstico real de ese apartamento.

### Flujo del anfitrión (modo edición)

```
Electrodoméstico con GLB → botón "Editar puntos de interés"
→ Abre ApplianceHotspotEditor (modal con Three.js)
→ Se carga el modelo GLB del anfitrión
→ Anfitrión hace click sobre el modelo:
   → raycaster.intersectObjects(modelMeshes, true) → intersects[0].point (Vector3 world space)
   → Input flotante aparece cerca del click
   → Anfitrión escribe la etiqueta ("Botón de encendido")
   → POST /api/appliances/hotspots { applianceId, label, positionX, positionY, positionZ }
   → Esfera roja aparece en el punto marcado
→ Lista de hotspots debajo del canvas con botón de eliminar
→ DELETE /api/appliances/hotspots?id=xxx → esfera eliminada del canvas y de la lista
```

### Flujo del huésped (modo lectura)

```
Huésped abre el visor 3D de un electrodoméstico
→ ApplianceViewer carga el modelo GLB
→ Tras cargar: GET /api/appliances/hotspots?applianceId=xxx
→ Por cada hotspot: THREE.SphereGeometry(0.05) + MeshBasicMaterial(color: #e24b4a)
→ sphere.position.set(positionX, positionY, positionZ)  ← coordenadas world space
→ sphere.userData = { label }
→ Huésped hace click sobre una esfera:
   → raycaster.intersectObjects(hotspotMeshes) → label del userData
   → Tooltip oscuro aparece encima de la esfera con la etiqueta
```

**Por qué las coordenadas son estables entre sesiones:** Las posiciones se guardan en world space después de aplicar el escalado y centrado del modelo (`scale = 1.6 / maxDim`). Como el mismo GLB siempre produce el mismo `maxDim` y `center`, el world space es idéntico en cada carga.

**Modelo de datos:**
```
ApplianceHotspot {
  id          — CUID
  applianceId — FK a Appliance (CASCADE delete)
  label       — "Botón de encendido"
  positionX/Y/Z — coordenadas Three.js world space
  createdAt
}
```

**Archivos:**
- `prisma/schema.prisma` — modelo `ApplianceHotspot`
- `src/app/api/appliances/hotspots/route.ts` — GET, POST, DELETE
- `src/components/host/ApplianceHotspotEditor.tsx` — editor Three.js con raycasting + input flotante
- `src/components/guest/ApplianceViewer.tsx` — carga y renderiza hotspots + tooltip on click
