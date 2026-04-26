# HestiaAI 🏠

> Asistente inteligente para huéspedes de alojamientos turísticos

---

## ¿De qué va el proyecto?

¿Alguna vez has alquilado un piso turístico y no sabías cómo funcionaba el aire acondicionado? ¿O has sido anfitrión y te han llamado a las 2 de la mañana para preguntar la contraseña del WiFi?

**Ese es exactamente el problema que resuelve HestiaAI.**

El anfitrión configura su propiedad una sola vez, sube los manuales de los electrodomésticos, y el sistema genera un código QR. El huésped lo escanea al llegar y tiene acceso a un chat que responde cualquier pregunta sobre el alojamiento, las 24 horas. No hace falta registrarse ni instalar ninguna app.

Si hay un problema real (una avería, por ejemplo), el huésped puede reportarlo directamente desde la misma pantalla. El anfitrión recibe un email con todos los detalles y gestiona todo desde su panel.

El nombre viene de **Hestia**, la diosa griega del hogar.

---

## ¿Qué puede hacer la aplicación?

### Panel del anfitrión

- **Dashboard** con resumen de propiedades, incidencias abiertas y electrodomésticos registrados
- **Gestión de propiedades** — crear, editar y eliminar con confirmación. Campos con límite de caracteres para evitar errores
- **Editar una propiedad** directamente desde su página de detalle
- **Electrodomésticos por categoría** — con manual en PDF que se lee automáticamente y se guarda para que la IA lo use
- **Modelos 3D interactivos** — el anfitrión puede subir un archivo `.glb` de cada electrodoméstico y añadir puntos de interés con etiquetas sobre el modelo
- **QR descargable** por propiedad para imprimir y colocar en el alojamiento
- **Panel de incidencias en tiempo real** — cuando un huésped reporta algo aparece al momento sin recargar la página, con indicador de nueva incidencia
- **Gestión de incidencias** — cambiar estado (pendiente → en proceso → resuelta), añadir notas internas y borrarlas
- **Aviso de inactividad** — las propiedades sin actividad de huéspedes en más de 15 días muestran un badge de alerta en la tarjeta

### Vista del huésped

El huésped accede escaneando el QR, sin cuenta ni instalación:

- **Chat con IA** — responde preguntas usando la información exacta de ese alojamiento. Si el anfitrión subió el manual del aire acondicionado, la IA sabe cómo funciona ese modelo concreto. Cuando hay un modelo 3D disponible, la IA sugiere abrirlo
- **Visor 3D** — puede explorar el electrodoméstico en tres dimensiones y ver los puntos de interés marcados por el anfitrión
- **Números de emergencia** — la IA siempre proporciona el contacto del anfitrión y los números nacionales (112, 061, 091, 092, 080) cuando se le pregunta
- **Límite de 20 mensajes por sesión** — para un uso responsable del servicio
- **Reportar incidencias** — con descripción, urgencia y franja horaria para el técnico
- **Seguimiento de incidencias** — el huésped puede ver el estado de lo que ha reportado, actualizado en tiempo real

### Estado automático de la propiedad

Cuando un huésped abre el QR por primera vez, la propiedad pasa automáticamente de "Disponible" a "Con huésped" en el panel del anfitrión, sin que nadie tenga que hacer nada.

### Emails automáticos

- Nueva incidencia → el anfitrión recibe un email con todos los detalles
- Incidencia resuelta → el huésped recibe confirmación (si dejó su correo)

---

## Tecnologías utilizadas

| Qué | Con qué | Por qué |
|---|---|---|
| Web completa | Next.js 14 | Frontend y backend en un solo proyecto |
| Diseño | Tailwind CSS | Rápido y consistente |
| Base de datos | PostgreSQL en Supabase | Gratuita, en la nube, con autenticación incluida |
| Acceso a datos | Prisma ORM | Migraciones sencillas y sin errores de tipos |
| Inteligencia artificial | Google Gemini Flash 2.0 | Contexto amplio, capa gratuita generosa, responde en cualquier idioma |
| Búsqueda semántica | RAG con text-embedding-004 | Solo los fragmentos de manual más relevantes llegan a la IA |
| Almacenamiento de archivos | Supabase Storage + Signed URLs | Los archivos grandes (modelos 3D) se suben directamente desde el navegador sin pasar por el servidor |
| Login de anfitriones | Supabase Auth | Autenticación lista sin implementarla desde cero |
| Emails | Resend | Simple y fiable |
| Códigos QR | librería qrcode | Genera el QR en el navegador, descargable como PNG |
| Lectura de PDFs | pdf-parse | Extrae el texto del manual automáticamente |
| Visor 3D | Three.js | Renderizado de modelos GLB con puntos de interés interactivos |
| Notificaciones en vivo | Supabase Realtime | Las incidencias aparecen en el panel sin recargar |
| Lenguaje | TypeScript | Menos bugs, errores detectados antes de ejecutar |

---

## Cómo funciona la IA por dentro

El sistema usa una técnica llamada **RAG** (Retrieval-Augmented Generation). En vez de enviar el manual completo a la IA en cada pregunta — lo que sería lento y caro — el manual se divide en fragmentos de 1.000 caracteres y cada uno se convierte en un vector numérico de 768 dimensiones (su "huella semántica").

Cuando el huésped hace una pregunta, se calcula la similitud entre esa pregunta y todos los fragmentos almacenados. Solo los 5 más relevantes se envían a Gemini junto con la pregunta. Resultado: respuestas más precisas, coste 30 veces menor y tiempo de respuesta menor a 2 segundos.

Los vectores se generan en paralelo (lotes de 10 simultáneos), lo que hace el proceso de indexación 10 veces más rápido que hacerlo uno a uno.

---

## Cómo probarlo en local

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

---

## Fechas clave

| Hito | Fecha |
|---|---|
| Vídeo demo | 02/05/2026 |
| Presentación al tribunal | 04/05/2026 |
| Entrega final | 11/05/2026 |
