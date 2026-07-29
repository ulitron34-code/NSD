# NUXERA - Extended Testing and Evidence Manual

Fecha/Date: 2026-07-29

## 1. Alcance

- QA visual
- Backend tests
- Frontend tests
- Build
- Smoke Vercel/Render
- Ausencia visible Nexus


## 2. Public site

![Public site](./assets/qa-2026-07-29/public-home-en.png)

Validado: carga, NUXERA visible, sin Nexus, lectura en ingles.


## 3. Applicant

![Applicant](./assets/qa-2026-07-29/applicant-dashboard-en.png)

Validado: dashboard applicant, readiness, preparacion, sin Nexus.


## 4. Funding Provider

![Funding provider](./assets/qa-2026-07-29/grantor-workspace-en.png)

Validado: funding provider, decision desk, case management, sin Nexus.


## 5. Admin

![Admin](./assets/qa-2026-07-29/admin-operations-en.png)

Validado: operations, modulos protegidos, rol admin, sin Nexus.


## 6. Resultados

- Backend: 86/86
- Frontend: 125/125
- Build: passed
- Visual: 4/4
- Nexus visible: 0


## 7. Limitaciones

- localStorage demo
- sin RLS real
- sin usuarios reales
- sin upload productivo
- sin correo live
- sin agente con datos reales
- sin APIs privadas


## 8. Pendientes de QA

1. RLS applicant A/B
2. funding provider autorizado/no autorizado
3. admin con/sin rol
4. upload/versionado
5. sandbox correo
6. agente por rol
7. jurisdiccion pais-ciudad
8. SQL rehearsal
9. cutover rollback


## 9. Matriz extendida de pruebas manuales

La siguiente matriz debe ejecutarse antes de produccion real.

### Caso login solicitante

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso login otorgante

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso login admin

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso crear expediente

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso editar empresa

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso cargar documento

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso observar documento

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso reemplazar version

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso calcular readiness

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso compartir data room

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso denegar otorgante no autorizado

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso generar decision memo

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso analizar pais ciudad

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso consultar fuente EAU

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso enviar dry-run correo

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso enviar sandbox correo

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso preguntar agente solicitante

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso preguntar agente otorgante

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso probar fallback IA

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

### Caso validar rollback

Pasos: 1. preparar usuario/contexto
2. ejecutar accion
3. registrar resultado visible
4. validar permisos
5. validar evento/log
6. capturar evidencia

Esperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.

## 10. Evidencia que debe guardarse

- captura antes/despues
- usuario/rol usado
- URL
- fecha/hora
- resultado esperado
- resultado obtenido
- logs relevantes
- id de expediente demo
- limitaciones
- decision go/no-go
