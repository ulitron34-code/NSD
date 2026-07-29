# NUXERA - Pruebas, Evidencia Visual y Estado de Calidad

Fecha: 2026-07-29  
Base revisada: `https://nsd-pi.vercel.app`  
Objetivo: dejar evidencia util para revision interna, socio, inversionistas y decision de sustitucion de Nexus por NUXERA.

## Resumen Ejecutivo

La verificacion hecha en esta sesion confirma que la experiencia visible de NUXERA esta activa en Vercel, que las vistas principales en ingles cargan, que no aparece Nexus como marca visible en los escenarios automatizados y que las pruebas locales criticas pasan.

Resultados principales:

- Capturas automatizadas en ingles: 4 escenarios ejecutados, 4 aprobados, 0 fallos, 0 referencias visibles a Nexus.
- Backend enfocado: 4 archivos de prueba, 86 pruebas aprobadas.
- Frontend NUXERA: 1 archivo de prueba, 125 pruebas aprobadas.
- Build frontend de produccion: aprobado.
- Smoke Vercel: pagina main y production responden HTTP 200, muestran NUXERA y no muestran Nexus visible.
- Smoke Render/backend remoto: en esta corrida el backend agoto 20 segundos en health y rutas protegidas. Esto no invalida el frontend ni los tests locales, pero queda como pendiente operativo de disponibilidad/latencia antes de una presentacion critica.

## Escenarios Visuales Ejecutados

### 1. Pagina Publica

URL: `https://nsd-pi.vercel.app/`  
Esperado: identidad NUXERA Financial Intelligence visible.  
Resultado: aprobado.  
Nexus visible: no.

![Pagina publica](./assets/qa-2026-07-29/public-home-en.png)

### 2. Solicitante

URL: `https://nsd-pi.vercel.app/dashboard`  
Sesion simulada: `applicant.qa@nuxera.local`  
Esperado: shell NUXERA y rol Applicant.  
Resultado: aprobado.  
Nexus visible: no.

![Solicitante](./assets/qa-2026-07-29/applicant-dashboard-en.png)

### 3. Otorgante

URL: `https://nsd-pi.vercel.app/dashboard/nuxera/cases`  
Sesion simulada: `grantor.qa@nuxera.local`  
Esperado: shell NUXERA y rol Funding provider.  
Resultado: aprobado.  
Nexus visible: no.

![Otorgante](./assets/qa-2026-07-29/grantor-workspace-en.png)

### 4. Administrador

URL: `https://nsd-pi.vercel.app/dashboard/nuxera/operations`  
Sesion simulada: `admin.qa@nuxera.local`  
Esperado: shell NUXERA y rol Admin.  
Resultado: aprobado.  
Nexus visible: no.

![Administrador](./assets/qa-2026-07-29/admin-operations-en.png)

## Pruebas Tecnicas Ejecutadas

Backend enfocado:

- Comando: Vitest sobre servicios y rutas NUXERA criticas.
- Cobertura de esta corrida: inteligencia jurisdiccional, persistencia operativa, readiness de agente conversacional y rutas NUXERA.
- Resultado: 4 archivos aprobados, 86 pruebas aprobadas.

Frontend NUXERA:

- Comando: Vitest sobre experiencia NUXERA.
- Resultado: 1 archivo aprobado, 125 pruebas aprobadas.

Build:

- Comando: Vite production build.
- Resultado: build aprobado en 4.58 segundos.

Smoke remoto:

- Vercel main: HTTP 200, NUXERA visible, Nexus no visible.
- Vercel production/alias: HTTP 200, NUXERA visible, Nexus no visible.
- Render health y rutas backend: timeout de 20 segundos en esta ejecucion.

## Interpretacion

La plataforma esta en buen estado para demostracion visual y funcional controlada. La parte que necesita cuidado antes de una presentacion en vivo es el backend remoto en Render: si esta dormido, con cold start largo o con saturacion, puede fallar una demo que dependa de respuestas API en tiempo real.

Recomendacion para presentacion:

1. Usar Vercel para mostrar la experiencia principal.
2. Tener capturas listas como respaldo.
3. Evitar depender de Anthropic/Render/NVIDIA en vivo salvo que se caliente el servicio antes.
4. Presentar agentes, notificaciones y persistencia como arquitectura controlada con gates, no como automatizacion sin supervision.
