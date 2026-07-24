# Modo de trabajo autorizado para este repo

El usuario autorizó explícitamente trabajar de forma autónoma en este repositorio (`nuxera-controlled-migration` y en general), sin pedir confirmación paso a paso. Esto queda escrito aquí para que persista entre sesiones y no dependa de que lo repita cada vez.

## Sin pedir autorización (proceder directo)

- Leer, escribir, editar y borrar archivos del repo.
- Instalar dependencias, correr build/lint/tests.
- Crear commits locales (git commit) las veces que haga falta.
- Ejecutar scripts, levantar servidores locales (frontend/backend), probar en navegador.
- Leer y escribir datos reales en Supabase de producción (este proyecto no tiene ambiente separado — es deliberado, ya se validó con el usuario). Incluye lecturas, y escrituras controladas cuando sean necesarias para verificar funcionalidad (crear/borrar datos de prueba, limpiar después). Si la escritura es grande o irreversible (ej. borrar datos reales de un usuario real, no de prueba), ahí sí avisar antes.
- Actualizar documentación, empaquetar avances a USB (`E:\NUXERA\`) y Downloads (`Downloads\nuxera\`).

## Único punto donde seguir avisando antes de actuar

- `git push` a GitHub (cualquier rama).
- Mergear o cerrar el PR #3.
- Tocar configuración real de Vercel o Render (variables de entorno, deploys de producción, activar flags en producción).

Para estas acciones: avisar qué se va a hacer y por qué, no necesariamente esperar una respuesta larga — un aviso breve basta salvo que el usuario pida lo contrario explícitamente.

## Contexto

Ver memoria de proyecto `project_nuxera_migration_status_180726` para el estado detallado de la migración NUXERA. Este archivo solo cubre el modo de trabajo (qué requiere aviso), no el estado del proyecto.
