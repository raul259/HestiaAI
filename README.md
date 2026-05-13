# HestiaAI

> Asistente inteligente para huéspedes de alojamientos turísticos

## ¿De qué va el proyecto?

¿Alguna vez has alquilado un piso turístico y no sabías cómo funcionaba el aire acondicionado? ¿O has sido anfitrión y te han llamado a las 2 de la mañana para preguntar la contraseña del WiFi?

**Ese es exactamente el problema que resuelve HestiaAI.**

El anfitrión configura su propiedad una sola vez, sube los manuales de los electrodomésticos, y el sistema genera un código QR. El huésped lo escanea al llegar y tiene acceso a un chat que responde cualquier pregunta sobre el alojamiento, las 24 horas. No hace falta registrarse ni instalar ninguna app.

Si hay un problema real, como una avería, el huésped puede reportarlo directamente desde la misma pantalla. El anfitrión recibe un email con todos los detalles y gestiona todo desde su panel.

El nombre viene de **Hestia**, la diosa griega del hogar.

## ¿Qué puede hacer la aplicación?

### Panel del anfitrión

- **Dashboard** con resumen de propiedades, incidencias abiertas y electrodomésticos registrados.
- **Gestión de propiedades**: crear, editar y eliminar propiedades con confirmación.
- **Edición de propiedades** directamente desde la página de detalle.
- **Electrodomésticos por categoría**, con manual en PDF que se lee automáticamente y se guarda para que la IA lo use.
- **Modelos 3D interactivos**: el anfitrión puede subir un archivo `.glb` de cada electrodoméstico y añadir puntos de interés con etiquetas sobre el modelo.
- **QR descargable** por propiedad para imprimir y colocar en el alojamiento.
- **Panel de incidencias en tiempo real**: cuando un huésped reporta algo aparece al momento sin recargar la página.
- **Gestión de incidencias**: cambiar estado, añadir notas internas y revisar el histórico.
- **Aviso de inactividad** para propiedades sin actividad reciente.

### Vista del huésped

El huésped accede escaneando el QR, sin cuenta ni instalación:

- **Chat con IA**: responde preguntas usando la información exacta de ese alojamiento. Si el anfitrión subió el manual del aire acondicionado, la IA sabe cómo funciona ese modelo concreto.
- **Visor 3D**: permite explorar el electrodoméstico en tres dimensiones y ver los puntos de interés marcados por el anfitrión.
- **Números de emergencia**: la IA puede proporcionar el contacto del anfitrión y números nacionales como 112, 061, 091, 092 y 080 cuando se le pregunta.
- **Límite de mensajes por sesión** para controlar el uso del servicio.
- **Reporte de incidencias** con descripción, urgencia, foto y franja horaria.
- **Seguimiento de incidencias** para que el huésped vea el estado de lo reportado.

### Estado automático de la propiedad

Cuando un huésped abre el QR por primera vez, la propiedad puede pasar automáticamente de disponible a ocupada en el panel del anfitrión, sin intervención manual.

### Emails automáticos

- Nueva incidencia: el anfitrión recibe un email con los detalles.
- Incidencia resuelta: el huésped recibe confirmación si dejó su correo.

## Tecnologías utilizadas

| Qué | Con qué | Por qué |
| --- | --- | --- |
| Web completa | Next.js 14 | Frontend y backend en un solo proyecto |
| Diseño | Tailwind CSS | Rápido y consistente |
| Base de datos | PostgreSQL | Base relacional robusta para propiedades, incidencias y conversaciones |
| Acceso a datos | Prisma ORM | Migraciones sencillas y tipos seguros |
| Autenticación | Supabase Auth | Login de anfitriones sin construir autenticación desde cero |
| Almacenamiento | Supabase Storage | Archivos de incidencias y modelos 3D |
| Inteligencia artificial | Google Gemini / Google GenAI | Respuestas en lenguaje natural para los huéspedes |
| Búsqueda semántica | RAG con embeddings | Solo los fragmentos de manual más relevantes llegan a la IA |
| Emails | Resend | Envío de notificaciones |
| Códigos QR | qrcode | Generación de QR descargables |
| Lectura de PDFs | pdf-parse / pdfjs-dist | Extracción de texto de manuales |
| Visor 3D | Three.js | Renderizado de modelos GLB con puntos de interés |
| Notificaciones en vivo | Supabase Realtime | Incidencias actualizadas sin recargar |
| Lenguaje | TypeScript | Menos errores en desarrollo |
| Contenedores | Docker y Docker Compose | Despliegue reproducible |

## Cómo funciona la IA por dentro

El sistema usa una técnica llamada **RAG** (Retrieval-Augmented Generation). En vez de enviar el manual completo a la IA en cada pregunta, el manual se divide en fragmentos y cada uno se convierte en un vector numérico.

Cuando el huésped hace una pregunta, se calcula la similitud entre esa pregunta y los fragmentos almacenados. Solo los fragmentos más relevantes se envían al modelo junto con la pregunta. Esto permite respuestas más precisas, menor coste y menor tiempo de respuesta.

## Requisitos previos

Para desarrollo local:

- Node.js 20 o superior.
- npm.
- PostgreSQL, local o en Supabase.
- Proyecto de Supabase para Auth, Realtime y Storage.
- API key de Google AI Studio para Gemini.
- API key de Resend si se quieren enviar emails reales.

Para Docker:

- Docker.
- Docker Compose v2.

## Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Configura las variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

GEMINI_API_KEY=tu_api_key_de_google_ai_studio
RESEND_API_KEY=re_tu_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000

POSTGRES_DB=hestia_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=cambia_esta_password

PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=cambia_esta_password
```

Notas importantes:

- `DATABASE_URL` es la conexión usada por Prisma.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` se usan para conectar con Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` se usa en rutas del servidor para operaciones protegidas de Storage.
- `NEXT_PUBLIC_APP_URL` debe coincidir con la URL donde se abre la aplicación.

## Cómo probarlo en local

```bash
# Clonar el proyecto
git clone https://github.com/raul259/HestiaAI.git
cd HestiaAI

# Instalar dependencias
npm install

# Copiar las variables de entorno y rellenarlas
cp .env.example .env

# Generar Prisma Client y preparar la base de datos
npx prisma generate
npm run db:push

# Arrancar el entorno de desarrollo
npm run dev
```

Abre:

```text
http://localhost:3000
```

## Implementar el entorno de desarrollo

Scripts disponibles:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Arranca la app en modo desarrollo |
| `npm run build` | Genera Prisma Client y compila Next.js para producción |
| `npm run start` | Arranca la app compilada |
| `npm run lint` | Ejecuta el linter |
| `npm run db:push` | Aplica el esquema de Prisma a la base de datos |
| `npm run db:seed` | Ejecuta datos iniciales desde `prisma/seed.ts` |
| `npm run db:studio` | Abre Prisma Studio |

Flujo recomendado:

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Para ver y editar datos desde una interfaz:

```bash
npm run db:studio
```

## Desplegar la base de datos

La aplicación usa PostgreSQL con Prisma. El esquema principal está en:

```text
prisma/schema.prisma
```

Modelos principales:

- `Property`: propiedades del anfitrión.
- `Appliance`: electrodomésticos de una propiedad.
- `ManualChunk`: fragmentos de manual con embeddings.
- `ApplianceHotspot`: puntos de interés sobre modelos 3D.
- `Incident`: incidencias reportadas.
- `IncidentNote`: notas de incidencias.
- `Conversation`: conversaciones del chat.

### Opción A: PostgreSQL con Docker Compose

Levanta solo la base de datos:

```bash
docker compose up -d db
```

Con las variables del `.env.example`, la conexión local sería:

```env
DATABASE_URL="postgresql://admin:cambia_esta_password@localhost:5432/hestia_db"
```

Después aplica el esquema:

```bash
npm run db:push
```

### Opción B: PostgreSQL en Supabase

1. Crea un proyecto en Supabase.
2. Copia la cadena de conexión PostgreSQL.
3. Pégala en `DATABASE_URL`.
4. Copia la URL del proyecto, la anon key y la service role key.
5. Configura esas claves en `.env`.
6. Aplica el esquema:

```bash
npm run db:push
```

### Buckets de Supabase Storage

Crea estos buckets:

| Bucket | Uso |
| --- | --- |
| `appliance-models` | Modelos 3D `.glb` |
| `incident-photos` | Fotos de incidencias |

La aplicación genera URLs públicas para estos archivos, así que los buckets deben permitir lectura pública o tener políticas equivalentes. Las subidas protegidas usan `SUPABASE_SERVICE_ROLE_KEY`.

## Desplegar la aplicación con Docker Compose

El repositorio incluye:

- `Dockerfile`
- `docker-compose.yaml`

El `docker-compose.yaml` levanta tres servicios:

| Servicio | Descripción | URL |
| --- | --- | --- |
| `app` | Aplicación Next.js | http://localhost:3001 |
| `db` | PostgreSQL | localhost:5432 |
| `pgadmin` | Gestor visual de PostgreSQL | http://localhost:8080 |

### Despliegue rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/raul259/HestiaAI.git
cd HestiaAI

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up -d
```

La aplicación estará disponible en:

```text
http://localhost:3001
```

El contenedor escucha internamente en `3000`, pero Docker lo publica en tu máquina en `3001` porque el compose tiene:

```yaml
ports:
  - "3001:3000"
```

### Usar la imagen de Docker Hub

El compose usa por defecto esta imagen:

```bash
docker pull raul2529/hestia-docker:v1
```

Enlace:

```text
https://hub.docker.com/r/raul2529/hestia-docker
```

### Construir la imagen localmente

Si prefieres construir la imagen desde el código del repositorio, edita `docker-compose.yaml` y cambia:

```yaml
image: raul2529/hestia-docker:v1
```

por:

```yaml
build:
  context: .
  dockerfile: Dockerfile
```

Después ejecuta:

```bash
docker compose up -d --build
```

## Comandos útiles de Docker

```bash
# Ver contenedores activos
docker compose ps

# Ver logs en tiempo real de la app
docker compose logs -f app

# Ver logs de PostgreSQL
docker compose logs -f db

# Detener todos los servicios sin borrar datos
docker compose down

# Detener servicios y borrar volúmenes de base de datos
docker compose down -v
```

## Despliegue público

Para publicar la aplicación online:

1. Sube el repositorio a GitHub.
2. Despliega PostgreSQL en Supabase o en otro proveedor compatible.
3. Crea los buckets `appliance-models` y `incident-photos`.
4. Configura todas las variables de entorno en la plataforma de despliegue.
5. Ejecuta el build:

```bash
npm run build
```

6. Publica la aplicación.

En producción, cambia:

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```
