# HestiaAI

Asistente virtual con inteligencia artificial para huéspedes de alojamientos vacacionales.

---

## 📖 Explicación idea del proyecto

Los anfitriones de pisos turísticos reciben decenas de mensajes repetitivos de sus huéspedes: cómo funciona el aire acondicionado, la contraseña del WiFi, a qué hora hay que dejar el piso, dónde tirar la basura... Interrupciones que llegan a cualquier hora y que quitan tiempo y energía.

**HestiaAI resuelve esto con un asistente de IA disponible 24/7.**

El anfitrión configura su propiedad una sola vez: añade los electrodomésticos, sube los manuales en PDF, escribe las instrucciones del piso. El sistema genera un código QR único para ese alojamiento. El huésped escanea el QR al llegar y accede a un chat que responde sus dudas usando la información exacta de esa propiedad, en el idioma que escriba.

Si hay un problema real (avería, accidente), el huésped puede reportar una incidencia directamente desde la misma interfaz. El anfitrión recibe un email inmediato con todos los detalles y puede seguir el estado desde su panel de control en tiempo real.

El nombre viene de **Hestia**, diosa griega del hogar.

---

## 🎯 Nuestros Objetivos

- **Reducir la carga del anfitrión** eliminando las preguntas repetitivas y las llamadas fuera de horario
- **Mejorar la experiencia del huésped** dándole acceso inmediato a toda la información del alojamiento sin esperar respuesta humana
- **Centralizar la gestión** de propiedades, electrodomésticos e incidencias en un único panel
- **Automatizar las comunicaciones** — emails automáticos al anfitrión cuando llega una incidencia, y al huésped cuando se resuelve
- **Dar visibilidad al huésped** sobre el estado de sus incidencias en tiempo real, sin necesidad de cuenta ni contraseña
- **Construir una solución escalable** donde un anfitrión puede gestionar múltiples propiedades desde una sola cuenta

---

## 🌐 Tecnologías Usadas

| Capa | Tecnología | Para qué se usa |
|---|---|---|
| Framework | Next.js 14 (App Router) | Frontend + backend en un solo proyecto. SSR, rutas API integradas |
| Estilos | Tailwind CSS | Diseño responsive sin CSS manual |
| Base de datos | PostgreSQL (Supabase) | Base de datos relacional en la nube, gratuita |
| ORM | Prisma | Acceso a la base de datos con tipado, migraciones automáticas |
| Inteligencia Artificial | Google Gemini 2.5 Flash | Modelo de lenguaje que responde las preguntas del huésped |
| Autenticación | Supabase Auth | Login y registro de anfitriones con JWT y cookies seguras |
| Emails | Resend | Notificaciones automáticas al anfitrión y al huésped |
| Códigos QR | qrcode (npm) | Genera el QR de cada propiedad, descargable como PNG |
| Extracción PDF | pdf-parse (npm) | Extrae el texto de los manuales de electrodomésticos en PDF |
| Tiempo real | Supabase Realtime | Las incidencias aparecen en el panel sin recargar la página |
| 3D / Landing | Three.js | Escena interactiva en la página de inicio |
| Lenguaje | TypeScript | Código tipado, menos errores en tiempo de ejecución |

---

## 🔗 Funcionalidades Web

### Panel del anfitrión (`/host`)
- **Registro y login** con email y contraseña — confirmación por email
- **Dashboard** con contador de propiedades, incidencias abiertas y electrodomésticos
- **Incidencias en tiempo real** — aparecen con borde verde y badge "Nueva" sin recargar la página
- **Gestión de propiedades** — crear, editar y eliminar alojamientos con todos sus datos (WiFi, checkout, emergencias...)
- **Gestión de electrodomésticos** — añadir aparatos por categoría (TV, aire acondicionado, lavadora...) con su manual
- **Subida de manuales PDF** — el texto se extrae automáticamente y rellena el campo del manual
- **Generación de QR** — QR por propiedad con los colores de marca, descargable como PNG
- **Gestión de incidencias** — cambiar el estado (abierta → en proceso → resuelta), con notificación email al huésped al resolver

### Vista del huésped (`/guest/{propertyId}`)
Accesible escaneando el QR, sin necesidad de registro.

- **Chat con IA** — responde preguntas sobre la propiedad, los electrodomésticos, el WiFi, el checkout... usando los datos exactos del alojamiento
- **Historial de conversación** — se mantiene durante la sesión en el navegador
- **Reportar incidencia** — formulario con categoría, prioridad, descripción, datos de contacto opcionales y franja horaria para el técnico
- **Mis incidencias** — tab con seguimiento en tiempo real del estado de las incidencias reportadas en esa sesión. Se actualiza automáticamente cuando el anfitrión cambia el estado

### Notificaciones automáticas
- Email al **anfitrión** cuando un huésped reporta una incidencia (con todos los detalles y botón al panel)
- Email al **huésped** cuando el anfitrión marca la incidencia como resuelta (si dejó su email)

---

## Roadmap

```
FASE 1 — Base del proyecto
[████████████████████████] COMPLETADO

FASE 2 — Funcionalidades principales
[████████████████████████] COMPLETADO

FASE 3 — Funcionalidades avanzadas
[████████████████░░░░░░░░] EN PROGRESO

FASE 4 — Presentación y entrega
[░░░░░░░░░░░░░░░░░░░░░░░░] PENDIENTE
```

### Tabla de tareas

| # | Tarea | Fecha objetivo | Estado |
|---|---|---|---|
| 1 | Estructura del proyecto (Next.js + Prisma + Tailwind) | — | ✅ Completado |
| 2 | Modelos de datos (Property, Appliance, Incident, Conversation) | — | ✅ Completado |
| 3 | CRUD de propiedades | — | ✅ Completado |
| 4 | CRUD de electrodomésticos | — | ✅ Completado |
| 5 | Chat con IA (Gemini) contextualizado por propiedad | — | ✅ Completado |
| 6 | Migración a PostgreSQL (Supabase) | — | ✅ Completado |
| 7 | Autenticación de anfitriones (Supabase Auth) | — | ✅ Completado |
| 8 | Extracción de texto desde PDF | — | ✅ Completado |
| 9 | Formulario de incidencias con cita para técnico | — | ✅ Completado |
| 10 | Notificación email al anfitrión al crear incidencia | — | ✅ Completado |
| 11 | Notificación email al huésped al resolver incidencia | — | ✅ Completado |
| 12 | Generación de código QR por propiedad | 08/04/2026 | ✅ Completado |
| 13 | Dashboard en tiempo real (Supabase Realtime) | 16/04/2026 | ✅ Completado |
| 14 | Seguimiento de incidencias en la vista del huésped | — | ✅ Completado |
| 15 | Three.js avanzado en la landing (raycasting + hover) | 12/04/2026 | ⏳ Pendiente |
| 16 | Dashboard de métricas ESG | 26/04/2026 | ⏳ Pendiente |
| 17 | Despliegue en producción (Vercel) | Antes del 02/05 | ⏳ Pendiente |
| 18 | Vídeo demo | 02/05/2026 | ⏳ Pendiente |
| 19 | **Presentación al tribunal** | **04/05/2026** | — |
| 20 | **Entrega final** | **11/05/2026** | — |

### Diagrama Gantt

```
                         MAR       ABR            MAY
Tarea                    15  22  29  05  12  19  26  03  10
─────────────────────────────────────────────────────────────
Base + CRUD              ████
Chat IA + Auth               ████
PDF + Emails + QR                ████
Realtime dashboard                   ████
Three.js avanzado                        ████
Métricas ESG                                 ████
Despliegue + Demo                                ████
Tribunal / Entrega                                   ████
```

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/raul259/HestiaAI.git
cd HestiaAI

# 2. Instalar dependencias
npm install

# 3. Copiar las variables de entorno
cp .env.example .env
# Rellenar .env con tus credenciales de Supabase, Gemini y Resend

# 4. Generar el cliente Prisma y aplicar el schema
npx prisma db push

# 5. Arrancar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.
