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
| Three.js avanzado (raycasting) | 12/04 | ⏳ Pendiente |
| Dashboard métricas ESG | 26/04 | ⏳ Pendiente |
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
