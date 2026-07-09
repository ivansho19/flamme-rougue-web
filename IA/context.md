# Contexto del proyecto

## 1. Resumen
Repositorio: flamme-rougue-web.
Frontend web para Flammes Rouges, construido con Angular. Backend y contratos API se gestionan en un proyecto separado.

## 2. Arquitectura y modulos
- App shell y rutas: src/app/app.routes.ts
- Configuracion de app: src/app/app.config.ts
- Auth: src/app/auth (login, register, services)
- Feature: src/app/feature
  - home
  - profiles
  - create-profile
  - update-profile
  - payments
  - dashboard/my-top-rojo
- Shared: src/app/shared (components, services, models)
- Core: src/app/core (Pendiente)

## 3. Tecnologias y versiones
- Node.js: v20.20.0 (informado por el usuario)
- Angular: 17.3.x
- Angular CLI: 17.3.12
- TypeScript: 5.4.2
- UI: Angular Material 17.3.10, Bootstrap 5.3.8, Bootstrap Icons 1.13.1
- i18n: @ngx-translate/core 17.0.0, @ngx-translate/http-loader 17.0.0
- RxJS: 7.8.x
- Otros: embla-carousel 8.6.0, @stripe/stripe-js 8.6.1
- Testing tooling: Jasmine 5.1, Karma 6.4

## 4. Endpoints y contratos existentes
Backend separado. Endpoints referenciados desde entornos (src/environments/*.ts):
- POST /auth/login
- POST /auth/register
- POST /auth/registerClient
- POST /auth/forgot-password
- GET /auth/client/{email}
- /profiles (CRUD, contrato Pendiente)
- /top-rojo (contrato Pendiente)
- /comments (contrato Pendiente)

## 5. Integraciones (APIs, colas, BDs)
- API backend (base URL por entorno):
  - dev: http://localhost:5000/api
  - prd: https://flamme-rouge-backend-production.up.railway.app/api
- PayPal (clientId y currency en entornos)
- Stripe (libreria @stripe/stripe-js, uso Pendiente)
- Colas/BDs: Pendiente (gestionadas por el backend)

## 6. Modelo de datos (alto nivel)
- Autenticacion: IAuthRequest, IAuthResponse (src/app/auth/register/models)
- Entidades sugeridas por endpoints: Profile, TopRojo, Comment (contratos Pendiente)

## 7. Estandares y convenciones de codigo
- Estructura por modulos Angular: auth, feature, shared, core
- Estilos SCSS por defecto
- Convenciones adicionales de nombres, logs y excepciones: Pendiente

## 8. Testing (unitario, integracion, datos de prueba)
- Frameworks disponibles: Jasmine + Karma
- Estrategia de pruebas y datos: Pendiente

## 9. CI/CD y calidad (analisis estatico, cobertura, quality gate)
- CI/CD: Pendiente
- Analisis estatico y quality gate: Pendiente
- Cobertura minima: Pendiente

## 10. Seguridad (authn/authz, secretos)
- Modulo de auth con login/register en frontend
- Manejo de secretos: Pendiente (ej. PayPal clientId en entornos)
- Autorizacion y roles: Pendiente

## 11. Observabilidad (logs, metricas, trazas)
- Pendiente

## 12. Configuracion por entorno
- Angular CLI con file replacements:
  - development: src/environments/environment.dev.ts
  - production: src/environments/environment.prd.ts
- Entorno base: src/environments/environment.ts
- Variables clave: api_* y paypalClientId/paypalCurrency

## 13. Estrategia de ramas y commits
- Pendiente

## 14. Riesgos, supuestos y limitaciones
- Backend y contratos API en repositorio separado
- Documentacion de contratos y modelos incompleta en este repo
- Estrategias de calidad y seguridad aun no definidas

## 15. Glosario
- Auth: Modulo de autenticacion (login/registro)
- Profile: Perfil de usuario/cliente (contrato Pendiente)
- Top Rojo: Feature especifica del dominio (contrato Pendiente)
