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

## Sección 4: Testeo y Pulido

- [ ] Testeo en móvil + optimización Three.js — *22/04*
- [ ] **Dashboard de métricas ESG** (CO2 ahorrado, visitas evitadas, tiempo resolución) — *26/04*

---

## Sección 5: Defensa y Entrega

- [ ] **Vídeo demo** (flujo completo: QR → chat → incidencia → notificación) — *02/05*
- [ ] **Presentación técnica tribunal** — *04/05* 🔴
- [ ] **Documentación y entrega final** — *11/05* 🔴

---

## Mejoras competitivas — diferenciadores frente a Enso Connect / Hostfully / Touch Stay

### Mejoras sobre features existentes

- [x] **Multiidioma automático en chat** — Gemini detecta el idioma del huésped y responde en él. UI adaptada (saludo + preguntas rápidas) en 7 idiomas vía navigator.language.
- [ ] **Chat → botón abrir visor 3D** — cuando el huésped pregunta por un electrodoméstico, la IA ofrece abrirlo en 3D directamente desde el chat.
- [ ] **Foto adjunta en incidencias** — el huésped sube foto de la avería, la IA la describe automáticamente en el ticket.
- [x] **Categorización automática de incidencias por IA** — eliminar selección manual de categoría.

### Nuevas features diferenciadoras

- [ ] **Analytics para el anfitrión** — preguntas más frecuentes por propiedad, tiempo medio de resolución de incidencias.
- [ ] **PWA instalable** — el huésped añade HestiaAI a su pantalla de inicio como app nativa, sin App Store.

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
