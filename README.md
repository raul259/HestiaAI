# HestiaAI 🏠

> Asistente virtual con inteligencia artificial para huéspedes de alojamientos vacacionales

---

## 📖 ¿De qué va el proyecto?

¿Alguna vez has alquilado un piso turístico y no sabías cómo funcionaba el aire acondicionado? ¿O has sido anfitrión y te han llamado a las 2 de la mañana para preguntar la contraseña del WiFi?

**Ese es exactamente el problema que resuelve HestiaAI.**

La idea es simple: el anfitrión configura su piso una sola vez, sube los manuales de los electrodomésticos, y el sistema genera un código QR. El huésped lo escanea al entrar y tiene acceso a un chat que responde cualquier pregunta sobre el alojamiento, las 24 horas, en el idioma que quiera.

Y si hay algún problema real (una avería, por ejemplo), el huésped puede reportarlo directamente desde la misma app. El anfitrión recibe un email con todos los detalles y puede gestionar todo desde su panel.

El nombre viene de **Hestia**, la diosa griega del hogar. Me pareció que pegaba bastante.

---

## 🎯 ¿Qué queríamos conseguir?

Cuando empecé el proyecto  marqué unos objetivos claros:

- Que el anfitrión **reciba menos interrupciones** — nada de llamadas por tonterías a deshoras
- Que el huésped **tenga toda la información al momento**, sin esperar que le contesten
- Que toda la gestión (propiedades, averías, electrodomésticos) esté **en un solo sitio**
- Que las comunicaciones sean **automáticas** — email al anfitrión cuando hay una incidencia, email al huésped cuando se resuelve
- Que el huésped pueda **ver el estado de su incidencia en tiempo real**, sin necesidad de crearse una cuenta
- Que el sistema funcione para **varios pisos a la vez** desde una sola cuenta de anfitrión

---

## 🌐 ¿Qué tecnologías usamos?

Intenté elegir herramientas modernas pero que tuvieran sentido para el tamaño del proyecto:

| Qué | Con qué | Por qué lo elegí |
|---|---|---|
| La web completa | Next.js 14 | Me permite tener el frontend y el backend en un solo proyecto |
| El diseño | Tailwind CSS | Rápido de usar, queda bien sin mucho esfuerzo |
| La base de datos | PostgreSQL en Supabase | Gratuita, en la nube, con autenticación incluida |
| Acceso a los datos | Prisma | Evita errores, las migraciones son muy fáciles |
| La inteligencia artificial | Google Gemini 2.5 Flash | Contexto enorme, capa gratuita generosa, responde en cualquier idioma |
| El login de anfitriones | Supabase Auth | No tuve que implementar nada de seguridad.|
| Los emails | Resend | Tres líneas de código y funciona |
| Los códigos QR | librería qrcode | Genera el QR directamente en el navegador, descargable como PNG |
| Leer manuales PDF | librería pdf-parse | Extrae el texto automáticamente del PDF |
| Notificaciones en vivo | Supabase Realtime | Las incidencias aparecen en el panel sin recargar |
| La animación 3D de inicio | Three.js | Le da personalidad a la página de entrada |
| El lenguaje | TypeScript | Menos bugs, el editor te avisa de los errores |

---

## 🔗 ¿Qué puede hacer la aplicación?

### Lo que ve el anfitrión

Cuando el anfitrión inicia sesión accede a su panel donde puede:

- Ver de un vistazo cuántas propiedades tiene, cuántas incidencias están abiertas y cuántos electrodomésticos tiene registrados
- **Gestionar sus propiedades** — crear, editar o borrar pisos con toda su información (WiFi, instrucciones de salida, contacto de emergencias...)
- **Añadir electrodomésticos** por categoría y subir el manual en PDF — el texto se extrae solo y se guarda para que la IA lo use
- **Descargar el QR** de cada propiedad para imprimirlo y colgarlo en el piso
- **Ver las incidencias en tiempo real** — cuando un huésped reporta algo, aparece en el panel al momento con un borde verde y el aviso "Nueva incidencia", sin recargar la página
- **Cambiar el estado** de cada incidencia (pendiente → en proceso → resuelta) y borrarlas cuando ya no las necesite

### Lo que ve el huésped

El huésped accede escaneando el QR, sin registrarse ni instalar nada:

- **Chat con IA** — pregunta lo que quiera sobre el piso y recibe respuestas usando la información exacta de ese alojamiento. Si el anfitrión subió el manual del aire acondicionado, el chat sabe cómo funciona ese modelo concreto
- **Reportar una incidencia** — puede describir el problema, indicar la urgencia y proponer una franja horaria para que acuda un técnico. También puede dejar su email para recibir actualizaciones
- **Ver el estado de sus incidencias** — hay un tab "Mis incidencias" donde aparecen todas las que ha reportado en ese dispositivo, con su estado actualizado en tiempo real. Cuando el anfitrión la marca como resuelta, la tarjeta se pone en verde

### Los emails automáticos

- Cuando el huésped reporta una incidencia → el anfitrión recibe un email con todos los detalles
- Cuando el anfitrión resuelve la incidencia → el huésped recibe un email de confirmación (si dejó su correo)

---

## 📅 Roadmap

### Lo que ya está hecho ✅

- Toda la base del proyecto (estructura, base de datos, diseño)
- Login y registro de anfitriones
- Gestión completa de propiedades y electrodomésticos
- Chat con IA contextualizado por propiedad
- Subida y lectura automática de manuales PDF
- Formulario de incidencias con cita para técnico
- Emails automáticos al anfitrión y al huésped
- Generación de QR descargable por propiedad
- Dashboard en tiempo real con Supabase Realtime
- Tab de seguimiento de incidencias para el huésped

### Lo que queda por hacer ⏳

| Tarea | Fecha |
|---|---|
| Mejorar la animación 3D de la landing (Three.js) | 12/04/2026 |
| Dashboard de métricas y sostenibilidad (ESG) | 26/04/2026 |
| Despliegue en producción (Vercel) | Antes del 02/05 |
| Grabar el vídeo demo | 02/05/2026 |
| **Presentación al tribunal** | **04/05/2026** |
| **Entrega final** | **11/05/2026** |

---

## ⚙️ Cómo probarlo en local

```bash
# Clonar el proyecto
git clone https://github.com/raul259/HestiaAI.git
cd HestiaAI

# Instalar dependencias
npm install

# Copiar las variables de entorno y rellenarlas
cp .env.example .env

# Preparar la base de datos
npx prisma db push

# Arrancar
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te redirige al login automáticamente.
