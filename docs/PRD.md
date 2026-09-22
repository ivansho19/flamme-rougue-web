# PRD — Flammes Rouges

| Campo | Valor |
| --- | --- |
| Producto | Flammes Rouges |
| Repositorio | `flamme-rouge-web` (frontend Angular) |
| Versión del documento | 1.2 |
| Fecha | 17 de septiembre de 2026 |
| Estado | Borrador operativo (as-is + requisitos vigentes) |
| Idioma por defecto | Español (`es`) |
| Audiencia | Producto, ingeniería, QA, operación |
| Cambio 1.2 | SEO orgánico: descubrimiento de perfiles públicos (sitemap) + requisitos de indexación y relevancia |

---

## 1. Resumen ejecutivo

Flammes Rouges es una plataforma web de anuncios y perfiles de anunciantes para mayores de 18 años. El visitante descubre perfiles públicos, los abre, contacta y deja feedback (likes y comentarios). El anunciante crea y mantiene un perfil verificado (KYC), elige un plan de visibilidad y puede comprar campañas **TOP ROJO**. El usuario registrado (cliente) comenta y da like según su plan de comentarios. El administrador modera perfiles, KYC, planes y campañas.

El frontend vive en este repositorio. El backend, pagos y almacenamiento de medios se gestionan en servicios separados (API Railway, PayPal, Cloudinary).

**Propuesta de valor**

- Para visitantes: descubrir perfiles verificados, filtrar por búsqueda y ver campañas destacadas.
- Para anunciantes: publicar un perfil estructurado, pagar visibilidad y aparecer en home / TOP ROJO **y en búsqueda orgánica de Google** cuando el perfil es público.
- Para usuarios: participar con comentarios y likes, con planes que desbloquean más actividad.
- Para el negocio: monetizar visibilidad (planes de perfil + TOP ROJO) y engagement (planes de comentarios), con un panel de moderación; ampliar adquisición orgánica vía perfiles indexables.

---

## 2. Problema y oportunidad

Los anunciantes necesitan un canal digital para publicar un perfil con fotos, disponibilidad y contacto, con control de visibilidad y verificación. Los visitantes necesitan un directorio claro, con perfiles verificados y campañas destacadas. La plataforma necesita KYC, pagos y moderación para operar con seguridad, cumplimiento de mayoría de edad y control de contenido.

**Oportunidad SEO:** Google Search Console confirma que el sitemap se procesa, pero históricamente solo listaba páginas estáticas (`/`, `/home`, `/legal`, `/auth/register`). Los perfiles públicos (`/profile/:slug`) no se descubrían por sitemap. El negocio necesita que Google **descubra e indexe** perfiles activos automáticamente y que las fichas se relacionen con búsquedas reales (ciudad, nacionalidad, tipo de anuncio), **sin** páginas duplicadas ni keyword stuffing artificial.

---

## 3. Objetivos

### 3.1 Objetivos de producto

1. Permitir descubrir y abrir perfiles públicos desde home y búsqueda.
2. Permitir registro e inicio de sesión de **usuario** y **anunciante**.
3. Permitir crear y editar un perfil de anunciante con datos, disponibilidad, galería, KYC y plan.
4. Monetizar visibilidad (planes Básico / Pro / VIP y campañas TOP ROJO) y comentarios (gratis / mensual / anual).
5. Dar al admin herramientas para verificar KYC, activar/desactivar perfiles, gestionar usuarios y aprobar campañas y planes.
6. Permitir que Google descubra e indexe **automáticamente** los perfiles públicos activos (sin edición manual del sitemap por cada alta).
7. Mejorar la relevancia orgánica de fichas públicas usando atributos reales del perfil (ciudad, nacionalidad, género, etc.), no keywords inventadas.

### 3.2 Métricas de éxito (propuestas)

| Métrica | Definición | Meta inicial (a validar) |
| --- | --- | --- |
| Conversión a perfil publicado | Anunciantes que completan KYC + plan / registros anunciante | Medir baseline |
| Tiempo a publicación | Desde registro anunciante hasta perfil activo | Reducir fricción del accordion + pago |
| Tasa de pago PayPal vs WhatsApp | Mix de métodos de cobro | WhatsApp = pending hasta activación admin |
| TOP ROJO activos | Campañas `active` por ciudad | Máx. 5 slots por ciudad (rotación si hay más) |
| KYC pendiente | Ítems en cola de revisión | SLA de revisión (por definir) |
| Comentarios válidos | Comentarios enviados sin rechazo de plan / normas | Cumplir límites por plan |
| Cobertura sitemap perfiles | % de perfiles con `isActiveProfile === true` presentes en el sitemap de perfiles | 100 % tras cada alta/activación (objetivo dinámico) |
| Indexación orgánica | Perfiles públicos en estado “indexada” / con impresiones en Search Console | Medir baseline tras sitemap dinámico + SEO on-page |

---

## 4. Personas y roles

| Rol | Quién es | Acceso principal |
| --- | --- | --- |
| Visitante | No autenticado, +18 | Home, perfil público, legal, login/registro, cambio de idioma |
| Usuario (cliente) | Cuenta `client = true` | Login, likes, comentarios según plan, plan de comentarios |
| Anunciante | Cuenta de anunciante | Crear/editar perfil, planes de visibilidad, TOP ROJO, notificaciones de perfil |
| Administrador | `isAdmin = true` | Dashboard de moderación, edición de perfiles ajenos, notificaciones admin |

Reglas de negocio relevantes:

- Solo usuarios (clientes) pueden comentar en perfiles públicos. Los anunciantes no comentan como clientes.
- Like y comentario requieren sesión.
- El perfil de anunciante exige edad mínima 18.
- Al entrar a home se muestra un aviso de mayoría de edad.

---

## 5. Alcance

### 5.1 En alcance (producto actual)

- Autenticación: login, registro usuario / anunciante.
- Protección anti-bot con **Cloudflare Turnstile** en login y en ambos formularios de registro (usuario y anunciante); el token `cfTurnstileToken` se envía al backend y el submit queda bloqueado hasta completar el challenge.
- Home con carrusel TOP ROJO y listado de perfiles.
- Búsqueda de perfiles (mínimo 3 caracteres).
- Ficha pública de perfil (galería, contacto, likes, comentarios y respuestas).
- Alta y edición de perfil con KYC, imágenes (Cloudinary) y selección de plan.
- Pagos de planes de perfil, comentarios y TOP ROJO (PayPal o WhatsApp).
- Código promocional de prueba al crear perfil (`ALAFREE7DAYS`, 7 días).
- Dashboard anunciante: mis TOP ROJO, planes de comentarios.
- Dashboard admin: anunciantes, KYC, usuarios/planes de comentarios, TOP ROJO.
- i18n: ES, EN, FR, NL (existe `pt.json` no expuesto en el selector).
- Páginas legales: aviso, términos, privacidad, cookies, menores, contacto.
- Notificaciones (admin y perfil) vía API y Socket.io.
- SEO técnico base: `robots.txt`, canonical/meta vía `SeoService`, slug SEO de perfil (`/profile/:slug`), y generación de sitemap en build (`sitemap.xml` índice + `sitemap-static.xml` + `sitemap-profiles.xml`).

### 5.2 Fuera de alcance / pendiente

- Recuperación de contraseña (enlace en login comentado; endpoint de entorno existe).
- Stripe como método de pago (librería presente, flujo no activo).
- Guards de ruta Angular: `create-profile` declara `canActivate: []`; el resto de rutas autenticadas no tienen guard.
- App móvil nativa.
- Chat in-app (el contacto es teléfono / WhatsApp).
- Módulo `core` de Angular (aún no existe).
- CI/CD, quality gate y cobertura mínima definidos.
- **Sitemap 100 % dinámico en tiempo real** (sin depender de un deploy): ver FR-11 y roadmap P0 SEO.
- **SSR / prerender** de fichas `/profile/:slug` (SPA CSR hoy; limitación para crawlers).
- **Listados públicos por intención de búsqueda** (ciudad, nacionalidad, categoría) tipo `/ciudad/madrid`.
- Keyword stuffing, páginas duplicadas o landing vacías solo para SEO (explícitamente fuera de alcance).

---

## 6. Experiencia de usuario y flujos

### 6.1 Visitante — descubrir un perfil

1. Entra a `/home`.
2. Confirma mayoría de edad en el diálogo de bienvenida (Entrar / Salir).
3. Ve el carrusel de campañas TOP ROJO y el grid de perfiles (foto, nombre, ciudad, edad, verificado, plan).
4. Busca en el header (≥ 3 caracteres) o abre una tarjeta.
5. Llega a `/profile/:slug`: galería, datos, contacto, comentarios y like.

### 6.2 Usuario — registro y engagement

1. `/auth/register` → elige **Usuario**.
2. Completa nombre, apellido, email, contraseña y confirma contraseña.
3. Completa el challenge de Cloudflare Turnstile (“Verifique que es un ser humano”); sin token válido el botón de registro permanece deshabilitado.
4. Envía el formulario; el frontend incluye `cfTurnstileToken` en `POST /auth/register`.
5. Inicia sesión en `/auth/login` (email + password, mín. 6 caracteres + Turnstile obligatorio).
6. En un perfil: acepta normas de comunidad (primera vez), comenta o da like.
7. Si quiere más comentarios: `/dashboard/comment-plans` y elige plan de pago.

### 6.3 Anunciante — publicar perfil

1. `/auth/register` → elige **Anunciante**.
2. Completa datos del formulario y el challenge Turnstile; envía `cfTurnstileToken` en `POST /auth/registerClient`.
3. Tras login (también con Turnstile), va a `/create-profile` (formulario accordion):
   - Imágenes (principal + galería; watermark en galería).
   - Información básica (nombre, ciudad, zona, teléfono, países bloqueados, disponibilidad 24/7 o por días).
   - Datos personales (género, orientación, fecha de nacimiento ≥ 18, nacionalidad, idiomas, etc.).
   - Servicios / posibilidades, alcohol, tabaco.
   - Datos reales KYC (nombre, documento frente/reverso o pasaporte).
4. Al completar, se abre el modal de planes (Básico / Pro / VIP).
5. Paga con PayPal, confirma WhatsApp (queda pendiente) o aplica código promo de 7 días.
6. El perfil se crea; KYC queda pendiente de verificación admin. El perfil público se activa según reglas de plan y moderación.

### 6.4 Anunciante — TOP ROJO

1. `/dashboard/my-top-rojo` → Publicar TOP ROJO.
2. Completa ciudad, país, título, descripción, teléfono y hasta 2 fotos.
3. Elige duración: 24h / 3 días / 7 días.
4. Paga PayPal (puede quedar `active`) o WhatsApp (`pending` hasta que admin active).
5. La campaña aparece en el carrusel de home mientras esté activa.

### 6.5 Admin — moderación

1. `/admin/dashboard`.
2. Ve KPIs: total perfiles, activos, KYC pendientes, plan más popular.
3. Pestaña **Anunciantes**: buscar, verificar KYC, activar/desactivar, editar (`/admin/edit-profile/:id`), eliminar.
4. Pestaña **TOP ROJO**: filtrar all / pending / active / expired; activar o cancelar.
5. Pestaña **Usuarios**: listar, activar/expirar planes de comentarios, eliminar usuario.

---

## 7. Requisitos funcionales

### FR-01 Autenticación

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-01.1 | Login con email y password; persistir sesión (`token`, `userId`, `client`, `isAdmin`, `profileId`) | Must |
| FR-01.2 | Mostrar error claro si las credenciales son inválidas | Must |
| FR-01.3 | Registro de usuario (cliente) y de anunciante, con flujos separados | Must |
| FR-01.4 | Logout con confirmación | Must |
| FR-01.5 | Protección anti-bot con Cloudflare Turnstile en `/auth/login`, registro usuario y registro anunciante | Must |
| FR-01.5a | Widget `app-cf-turnstile` visible; el CTA de login/registro solo se habilita con token válido | Must |
| FR-01.5b | Enviar `cfTurnstileToken` al backend en login (`POST /auth/login`), registro usuario (`POST /auth/register`) y registro anunciante (`POST /auth/registerClient`) | Must |
| FR-01.5c | Ante error de carga del widget o fallo de auth, mostrar mensaje y resetear el challenge | Must |
| FR-01.5d | El site key de Turnstile se configura por entorno (`turnstileSiteKey`); el idioma del widget sigue el idioma activo de la app | Must |
| FR-01.6 | Recuperar contraseña | Should (API lista, UI no expuesta) |

### FR-02 Home y descubrimiento

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-02.1 | Listar perfiles públicos en grid responsive | Must |
| FR-02.2 | Mostrar badge de verificado y plan en la tarjeta | Must |
| FR-02.3 | Carrusel de campañas TOP ROJO activas | Must |
| FR-02.4 | Búsqueda en header con debounce 300 ms y mínimo 3 caracteres | Must |
| FR-02.5 | Diálogo de mayoría de edad al cargar home | Must |
| FR-02.6 | Idioma persistido en `localStorage` (`app-lang`) | Must |

### FR-03 Perfil público

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-03.1 | Mostrar galería, datos, disponibilidad, contacto y zona | Must |
| FR-03.2 | CTA de contacto por WhatsApp con mensaje prellenado | Must |
| FR-03.3 | Like autenticado | Must |
| FR-03.4 | Comentarios autenticados, solo clientes; respuesta del perfil | Must |
| FR-03.5 | Modal de normas de comunidad antes de comentar | Must |
| FR-03.6 | Respetar límite de comentarios según plan del usuario | Must |
| FR-03.7 | URL canónica `/profile/{slug}` con slug estable (nombre amigable + últimos 6 chars del id) | Must |
| FR-03.8 | Meta SEO de ficha: `index, follow`, canonical propia, título/description derivados del perfil | Must |
| FR-03.9 | Perfiles inactivos, privados o eliminados no deben presentarse como indexables | Must |

### FR-04 Perfil de anunciante (alta)

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-04.1 | Formulario por paneles con validación por sección | Must |
| FR-04.2 | Edad mínima 18 (fecha de nacimiento) | Must |
| FR-04.3 | Prefijo telefónico válido | Must |
| FR-04.4 | Subida de foto principal y galería; watermark en galería | Must |
| FR-04.5 | Límite de fotos según plan: Básico 8, Pro 15, VIP 30 | Must |
| FR-04.6 | KYC: documento (frente/reverso) o pasaporte, subido a Cloudinary | Must |
| FR-04.7 | Disponibilidad por días o 24/7 | Must |
| FR-04.8 | Países bloqueados opcionales | Should |
| FR-04.9 | Preview del perfil antes de publicar | Should |
| FR-04.10 | Código promo de 7 días al crear perfil, sin PayPal/WhatsApp | Must |

### FR-05 Edición de perfil

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-05.1 | `/my-profile` carga y actualiza el perfil del usuario | Must |
| FR-05.2 | Admin puede editar cualquier perfil en `/admin/edit-profile/:id` | Must |
| FR-05.3 | Si el perfil está inactivo (salvo admin o renovación de plan vencido), no permitir guardar como activo | Must |
| FR-05.4 | Avisar renovación de plan cuando falten pocos días | Should |

### FR-06 Planes de visibilidad (perfil)

| Plan | Precio | Capacidad clave |
| --- | --- | --- |
| Básico | 39 € / mes | Perfil activo, búsquedas normales, hasta 8 fotos, comentarios y estrellas, sin prioridad |
| Pro (recomendado, preseleccionado) | 79 € / mes | Posición mejor en ciudad, rotaciones destacadas, badge Recomendado, hasta 15 fotos |
| VIP | 149 € / mes | Prioridad máxima, home destacada, badge VIP, hasta 30 fotos, soporte prioritario |

Métodos de pago: PayPal (EUR) o WhatsApp (`+34645378025`). WhatsApp deja el alta en pendiente hasta confirmación operativa/admin.

### FR-07 Planes de comentarios

| Plan | Precio | Capacidad |
| --- | --- | --- |
| Gratis | 0 € | 1 comentario de bienvenida (no seleccionable para compra) |
| Mensual | 19 € / mes | Hasta 4 comentarios/mes + badge Miembro |
| Anual | 149 € / año | Comentarios ilimitados + badge Hombre Top |

Estados: `pending` | `active` | `cancelled` | `expired`. El admin puede activar o expirar.

### FR-08 TOP ROJO

| Plan | Duración | Precio | Promesa |
| --- | --- | --- | --- |
| TOP ROJO 24H | 24 h | 49 € | Top 5 de la ciudad + home, badge rojo |
| TOP ROJO 3 DÍAS | 72 h | 129 € | Igual, 3 días |
| TOP ROJO 7 DÍAS | 168 h | 249 € | Igual, 7 días |

Estados: `pending` | `active` | `expired` | `cancelled`.

Regla de inventario: máximo 5 slots por ciudad; si hay más, rotación automática (intervalo 10–15 min, definido en modelo).

Campos de campaña: `profileId`, `displayName`, `city`, `country`, `title`, `description`, `contactPhone`, imágenes, `planType`.

### FR-09 Administración

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-09.1 | KPIs: total perfiles, activos, KYC pendientes, plan popular | Must |
| FR-09.2 | Listar/paginar/buscar perfiles; activar, desactivar, eliminar, editar | Must |
| FR-09.3 | Verificar KYC | Must |
| FR-09.4 | Listar TOP ROJO por estado; activar y cancelar | Must |
| FR-09.5 | Listar usuarios; activar/expirar plan de comentarios; no eliminar admins | Must |
| FR-09.6 | Confirmación antes de acciones destructivas o de cambio de estado | Must |

### FR-10 Navegación, i18n y legal

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-10.1 | Header con búsqueda, idioma, menú móvil, atajos de dashboard según rol | Must |
| FR-10.2 | Notificaciones admin (campana) y notificaciones de perfil | Must |
| FR-10.3 | Página `/legal` con aviso, términos, privacidad, cookies, menores y contacto | Must |
| FR-10.4 | Catch-all `**` redirige a `/home` | Must |

### FR-11 SEO orgánico y sitemap

Objetivo de producto: que Google descubra e indexe perfiles públicos activos y que las fichas se relacionen con búsquedas reales a partir de **atributos del perfil** (p. ej. ciudad + nacionalidad + género), sin duplicar páginas ni inventar keywords.

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-11.1 | `robots.txt` permite rastrear `/`, `/home`, `/legal` y `/profile/`; bloquea áreas privadas (`/auth/`, `/admin/`, `/create-profile`, `/my-profile`, `/payments`, `/dashboard/`) | Must |
| FR-11.2 | Declarar en `robots.txt` el sitemap canónico `https://flammesrouges.com/sitemap.xml` | Must |
| FR-11.3 | El sitemap (o índice de sitemaps) incluye páginas estáticas públicas y **todas** las URLs `/profile/{slug}` con `isActiveProfile === true` | Must |
| FR-11.4 | La inclusión de un perfil nuevo/publicado en el sitemap **no requiere edición manual** del XML | Must |
| FR-11.5 | Objetivo técnico: sitemap de perfiles **dinámico** (servido en request desde backend o función serverless), para no depender de un redeploy por cada alta | Must (target) |
| FR-11.6 | Estado intermedio aceptable: generación en `npm run build` desde `GET /profiles/getAllProfiles` (`scripts/generate-sitemap.mjs`) hasta completar FR-11.5 | Should (as-is) |
| FR-11.7 | URLs del sitemap usan el dominio canónico `https://flammesrouges.com` (sin variante www duplicada) | Must |
| FR-11.8 | No incluir en sitemap perfiles inactivos, privados, eliminados ni rutas `Disallow` | Must |
| FR-11.9 | Título y description de ficha pública incorporan atributos reales disponibles (nombre, ciudad, nacionalidad, género/orientación según datos del anuncio), sin keyword stuffing | Should |
| FR-11.10 | Listados públicos indexables por ciudad/categoría (p. ej. Madrid, nacionalidad) que enlacen a perfiles | Could (roadmap) |
| FR-11.11 | HTML rastreable de fichas (SSR o prerender) para que title/description/canonical no dependan solo de JS del cliente | Could (roadmap) |

**Separación de responsabilidades (producto)**

| Necesidad | Mecanismo |
| --- | --- |
| Descubrimiento de URLs nuevas | Sitemap dinámico + enlaces internos (home, búsqueda, listados) |
| Relación con búsquedas (“madrid colombiana”, “chica trans”, etc.) | Contenido y meta de la ficha / listados a partir de datos reales del perfil |
| No hacer | Páginas clonadas, keywords artificiales en el sitemap, indexar perfiles inactivos |

---

## 8. Requisitos no funcionales

| ID | Área | Requisito |
| --- | --- | --- |
| NFR-01 | Performance | Home debe mostrar skeletons mientras cargan perfiles; carrusel autoplay ~4 s |
| NFR-02 | Responsive | Planes y modales usables en móvil (swipe, botón cerrar, no recorte); formularios de login/registro con scroll interno cuando el widget Turnstile alarga el bloque |
| NFR-03 | i18n | UI en ES, EN, FR, NL; default `es` |
| NFR-04 | Seguridad | Token en interceptor; Turnstile obligatorio en login/registro; no loguear secretos ni site keys; KYC e imágenes fuera del repo |
| NFR-05 | Edad | Bloqueo de menores: disclaimer, validación 18+ y sección legal de menores |
| NFR-06 | Disponibilidad | Frontend estático; API en Railway (dev/QA/prod) |
| NFR-07 | Observabilidad | Pendiente (logs/métricas/trazas de frontend no definidos) |
| NFR-08 | Accesibilidad | Labels de formularios y toasts; mejorar a11y de modales (Should) |
| NFR-09 | Pagos | Moneda EUR; PayPal client-side + create/capture order en backend |
| NFR-10 | Tiempo real | Socket.io para notificaciones |
| NFR-11 | SEO / indexación | Dominio canónico `https://flammesrouges.com`; perfiles públicos indexables (`index, follow` + canonical propia); sitemap coherente con `robots.txt` |
| NFR-12 | SEO / arquitectura | Hoy: SPA CSR (Angular) en Netlify; metas de perfil se aplican en cliente. Limitación conocida para crawlers hasta SSR/prerender (FR-11.11) |

---

## 9. Arquitectura (vista de producto)

```
[Visitante / Usuario / Anunciante / Admin]
                │
                ▼
     Angular 17 SPA (este repo)
     Layout + lazy feature modules
                │
     ┌──────────┼──────────┬─────────────┬──────────────┐
     ▼          ▼          ▼             ▼              ▼
  API REST   PayPal    Cloudinary    Socket.io    Cloudflare
  (Railway)  (EUR)     (imágenes)    (notifs)     Turnstile
```

**Stack frontend:** Angular 17.3, TypeScript 5.4, Angular Material, Bootstrap 5, ngx-translate, RxJS 7.8, Embla Carousel, socket.io-client, Cloudflare Turnstile (`app-cf-turnstile`), @stripe/stripe-js (no usado en flujo activo).

**Hosting / estáticos SEO:** Netlify publica `dist/flamme-rouge-web/browser`. `robots.txt` y `sitemap*.xml` se copian como assets (`angular.json`). Las rutas SPA hacen fallback a `index.html`; los XML estáticos en raíz deben seguir sirviéndose con precedencia sobre el catch-all.

**Entornos**

| Entorno | API |
| --- | --- |
| Local / QA (file `environment.dev.ts`) | `https://flamme-rouge-backend-qa.up.railway.app/api` (también documentado localhost:5000) |
| Producción | `https://flamme-rouge-backend-production-251b.up.railway.app/api` |
| SPA local | `ng serve` → `http://localhost:4200` |
| Sitio canónico | `https://flammesrouges.com` |

---

## 10. Mapa de rutas

| Ruta | Auth esperado | Descripción |
| --- | --- | --- |
| `/` | No | Redirect a `/home` |
| `/home` | No | Descubrimiento |
| `/auth/login` | No | Login (email, password + Turnstile) |
| `/auth/register` | No | Registro usuario o anunciante (ambos con Turnstile) |
| `/legal` | No | Legales |
| `/profile/:slug` | No | Ficha pública |
| `/create-profile` | Sí (anunciante) | Alta de perfil + KYC + plan |
| `/my-profile` | Sí (anunciante) | Edición propia |
| `/admin/dashboard` | Sí (admin) | Moderación |
| `/admin/edit-profile/:id` | Sí (admin) | Edición de perfil ajeno |
| `/payments` | Sí | Flujo de pago |
| `/dashboard/my-top-rojo` | Sí (anunciante) | Campañas TOP ROJO |
| `/dashboard/comment-plans` | Sí (usuario) | Plan de comentarios |
| `/**` | — | Redirect a `/home` |

Nota de implementación: las rutas autenticadas **no tienen guards** en el router; la sesión se infiere de `localStorage`. Esto es un hueco de seguridad/UX a cerrar.

---

## 11. Modelo de datos (alto nivel)

### Perfil de anunciante

`displayName`, `bio`, `email`, `phone`, `country`, `city`, `zone`, `availability[]`, `gender`, `orientation`, `birthDate` / `age`, `nationality`, `height`, `weight`, `hairColor`, `eyeColor`, `languages[]`, `plan`, `imagesMain`, `imagesGallery[]`, `posibilities[]`, `alcohol`, `cigarette`, `isActiveProfile`, `isVerify`, `blockedCountries[]`, `promoCode`, `promoDurationDays`, `planExpiresAt`.

### KYC

`userId`, `fullName`, `age`, `nationality`, `phone`, `email`, `documentImage` (`url`, `public_id`).

### Usuario autenticado

`_id`, `name`, `email`, `token`, `client`, `isAdmin`, `profileId`.

### Auth request (login / registro)

Campos base: `name`, `lastName`, `email`, `password` (según flujo). Anti-bot: `cfTurnstileToken` (obligatorio en UI; validado en backend).

### TOP ROJO

Ver sección FR-08. Incluye métricas `views`, `clicks`, `inquiries` y ventana `startDate` / `endDate`.

### Plan de comentarios

`planType`, `status`, `badge`, `startedAt`, `expiresAt`, `usage { used, limit, window }`.

---

## 12. Integraciones y APIs

Contrato de backend (prefijo `/api`):

| Área | Endpoints usados por el frontend |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/registerClient` (body incluye `cfTurnstileToken`), `POST /auth/forgot-password`, `GET /auth/client/{email}` |
| Anti-bot | Cloudflare Turnstile (site key en `environment.turnstileSiteKey`; verificación del token en backend) |
| Perfiles | `POST /profiles/createProfile`, `GET /profiles/getAllProfiles`, `GET /profiles/getProfile/:id`, `GET /profiles/getProfileByUser/:userId`, `PUT /profiles/updateProfile/:id`, `GET /profiles/searchProfiles`, `POST /profiles/createKYC`, `GET /profiles/getAllKYC` |
| Admin | `GET /admin/getAllProfiles`, `GET /admin/getAllUsers`, `DELETE /admin/deleteUser/:id`, `DELETE /admin/deleteProfile/:id`, `PUT /admin/activeProfile/:id`, `PUT /admin/verifyKYC/:kycId`, `GET /admin/top-rojo`, `PUT /admin/top-rojo/:id/status`, comment-plan admin |
| TOP ROJO | `POST /top-rojo/create`, listado público para banner |
| Comentarios / ratings | `GET/POST /comments`, `POST /ratings/toggle`, `GET /ratings/profile` |
| Comment plans | `activate`, `status`, `cancel` |
| Pagos | `POST /paypal/create-order`, `POST /paypal/capture-order` |
| Notificaciones | `GET /notifications` |

---

## 13. Cumplimiento y contenido

- El sitio es para **mayores de 18 años**.
- Posicionamiento legal en UI: espacio de entretenimiento y anuncios; **no es un sitio de prostitución ni promueve trata**.
- KYC obligatorio para anunciantes antes de operar como perfil verificado.
- Normas de comunidad para comentarios (respeto, opiniones reales, etc.).
- Página legal cubre aviso, términos (usuarios, anuncios, prohibiciones, pagos, responsabilidad), privacidad, cookies, menores y contacto.

Cualquier cambio de copy legal debe pasar por revisión jurídica; este PRD no sustituye asesoría legal.

---

## 14. Criterios de aceptación globales

Un incremento se considera listo cuando:

1. El flujo feliz del rol afectado funciona contra API QA.
2. Validaciones de formulario y toasts de error están traducidos.
3. En móvil, modales de planes se cierran con X y no quedan recortados.
4. Pagos PayPal crean/capturan orden; WhatsApp deja estado `pending` coherente.
5. Admin puede completar la acción de moderación asociada.
6. No se rompe el disclaimer de +18 ni la validación de edad 18+.
7. No se suben secretos (PayPal client id de prod, Turnstile site key, etc.) a issues públicas.
8. Login y registro (usuario y anunciante) no permiten submit sin Turnstile válido; el token viaja al backend y, si falla, el widget se resetea.
9. Perfiles públicos activos aparecen en el sitemap de perfiles con su URL canónica; perfiles inactivos no.
10. Ficha pública expone (tras carga) `robots` indexable y `link rel="canonical"` a su propia URL en `flammesrouges.com`.
11. No se añaden páginas duplicadas ni keywords artificiales solo para SEO.

---

## 15. Riesgos y supuestos

| Riesgo / supuesto | Impacto | Mitigación |
| --- | --- | --- |
| Backend y contratos viven en otro repo | El frontend puede desalinearse | Versionar contratos o OpenAPI |
| Rutas sin guards | Acceso a pantallas autenticadas sin token | Añadir `AuthGuard` / `AdminGuard` |
| Pago WhatsApp es manual | Perfiles/campañas quedan pending | Cola admin clara + SLA |
| Promo code en environment | Fuga o abuso del trial | Rate limit y un uso por cuenta en backend |
| Stripe no está cableado | Expectativa de segundo PSP | Documentar como no disponible |
| Turnstile depende de Cloudflare y de validación backend | Login/registro fallan si el site key es inválido o el backend no verifica el token | Site key correcta por entorno; backend debe validar `cfTurnstileToken` con el secret key |
| Formularios auth más altos por el widget | CTA puede quedar bajo el fold | Scroll interno en columna de registro; padding suficiente en login |
| Contenido sensible +18 | Riesgo legal y de marca | KYC, legales, bloqueo de menores |
| Sitemap estático / solo en build | Perfiles nuevos no aparecen en Google hasta el siguiente deploy | Pasar a sitemap dinámico (FR-11.5); webhook de deploy como mitigación temporal |
| SPA sin SSR | Crawlers pueden no ver title/description/canonical de `/profile/:slug` | Prerender/SSR (FR-11.11); meanwhile metas client-side + sitemap + enlaces internos |
| Confundir descubrimiento con ranking | Expectativa de posicionar solo con sitemap | Separar FR-11 descubrimiento vs relevancia (atributos + listados) |
| Keyword stuffing / landings vacías | Riesgo de calidad y posible acción manual | Prohibido en alcance; SEO solo con datos reales del perfil |

---

## 16. Roadmap sugerido (post as-is)

| Prioridad | Ítem |
| --- | --- |
| P0 | Guards de autenticación y rol en router |
| P0 | **SEO:** sitemap de perfiles dinámico (backend Railway o Netlify Function) sin edición manual ni dependencia de redeploy (FR-11.5) |
| P1 | **SEO:** título/description de ficha con atributos reales (ciudad, nacionalidad, género) (FR-11.9) |
| P1 | Flujo forgot-password |
| P1 | Exponer o retirar `pt.json` |
| P1 | Tests e2e de los 6 flujos de la sección 6 |
| P2 | **SEO:** listados públicos por ciudad / categoría con enlaces a perfiles (FR-11.10) |
| P2 | **SEO:** SSR o prerender de `/profile/:slug` (FR-11.11) |
| P2 | Stripe o unificar PSP |
| P2 | Búsqueda avanzada (ciudad, plan, verificado) en home |
| P2 | Observabilidad frontend (errores, RUM) |
| P3 | Módulo `core`, CI y quality gate |

**Fases SEO acordadas (producto)**

1. Descubrimiento: sitemap dinámico de perfiles activos.
2. Relevancia on-page: meta/H1 a partir de datos del perfil.
3. Intención de búsqueda: listados por ciudad/categoría.
4. HTML real para crawlers: SSR/prerender.

---

## 17. Glosario

| Término | Significado |
| --- | --- |
| Anunciante | Usuario que publica un perfil de anuncio |
| Usuario / cliente | Cuenta que comenta y da likes |
| KYC | Verificación de identidad del anunciante (Know Your Customer) |
| TOP ROJO | Campaña de visibilidad premium (home + top de ciudad) |
| Plan de perfil | Básico / Pro / VIP; limita fotos y prioriza listados |
| Plan de comentarios | Gratis / mensual / anual; limita comentarios y badge |
| Verificado | Perfil con KYC aprobado (`isVerify`) |
| Pending | Pago o campaña a la espera de activación (típico WhatsApp) |
| Turnstile | Challenge anti-bot de Cloudflare; token `cfTurnstileToken` requerido en login y registro |
| Sitemap | Archivo(s) XML que listan URLs públicas para que Google las descubra |
| Sitemap index | `sitemap.xml` que apunta a sitemaps hijos (estático + perfiles) |
| Slug de perfil | Segmento SEO de `/profile/:slug` (nombre slugificado + sufijo de id) |
| SEO on-page | Title, description, canonical y contenido visible de la ficha |
| CSR / SSR | Client-side rendering (actual) vs server-side rendering (objetivo crawlers) |

---

## 18. Referencias internas

- Rutas: `src/app/app.routes.ts`
- Entornos: `src/environments/environment*.ts` (incluye `turnstileSiteKey`)
- Componente Turnstile: `src/app/shared/components/cf-turnstile/`
- Auth UI: `src/app/auth/login/`, `src/app/auth/register/components/user-register-form/`, `src/app/auth/register/components/advertisers-register-form/`
- Auth service: `src/app/auth/service/auth.service.ts`
- Contexto técnico: `IA/context.md`
- i18n: `src/assets/i18n/es.json` (y en, fr, nl, pt)
- Modelos: `src/app/feature/create-profile/models/IProfileCreate.model.ts`, `src/app/shared/models/top-rojo.model.ts`, `src/app/shared/models/comment-plans.model.ts`, `src/app/auth/register/models/IAuth.model.ts`
- SEO / sitemap: `src/robots.txt`, `src/sitemap.xml`, `src/sitemap-static.xml`, `src/sitemap-profiles.xml`, `scripts/generate-sitemap.mjs`, `src/app/shared/services/seo/seo.service.ts`, `src/app/shared/clases/profileSlug.ts`
