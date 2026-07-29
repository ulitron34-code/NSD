from pathlib import Path
root=Path(__file__).resolve().parents[1]/'docs'/'nuxera-migration'/'docs'/'migration'
def b(items): return '\n'.join('- '+x for x in items)
def n(items): return '\n'.join(f'{i}. {x}' for i,x in enumerate(items,1))
def sec(t, body): return f'\n## {t}\n\n{body}\n'
def sub(t, body): return f'\n### {t}\n\n{body}\n'
doc_types=['Identidad','Corporativo','Fiscal','Financiero','Legal','Tecnico','Proyecto','Garantias','Cumplimiento','Regulatorio','Impacto ESG','Evidencia complementaria']
states=['borrador','recibido','en revision','observado','requiere aclaracion','aprobado por revision humana','bloqueado','reemplazado por nueva version']
roles=['solicitante','otorgante','administrador','agente','servicio de notificaciones']

def functional_annex(lang='ES'):
 out=[]
 out.append(sec('8. Matriz ampliada de documentos', 'La operacion documental debe permitir que cada archivo tenga categoria, requisito asociado, version, fecha, responsable, estado y observacion. La plataforma debe evitar que un documento quede como archivo suelto sin relacion operativa.\n\nCategorias:\n\n'+b(doc_types)+'\n\nEstados posibles:\n\n'+b(states)))
 for dt in doc_types:
  out.append(sub('Documento - '+dt, 'Funcion: acreditar informacion de tipo '+dt.lower()+'. Paso a paso: '+n(['identificar requisito','subir archivo','asociar categoria','validar metadata','revisar completitud','marcar resultado','notificar faltante si aplica'])+'\n\nResultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.'))
 out.append(sec('9. Flujos operativos por rol', 'Cada rol opera una parte distinta del ciclo. El valor de NUXERA esta en que estos ciclos se conectan sin mezclar permisos.'))
 for r in roles:
  out.append(sub('Flujo de '+r, n(['entra con rol correcto','consulta solo informacion permitida','ejecuta accion propia del rol','genera evento trazable','recibe o dispara notificacion si aplica','deja evidencia para auditoria'])+'\n\nRiesgo a evitar: que '+r+' opere fuera de su alcance o vea datos que no corresponden.'))
 out.append(sec('10. Escenarios practicos de uso', 'Escenario 1: solicitante incompleto. La plataforma debe mostrar brechas, documentos faltantes y acciones. Escenario 2: expediente listo con observaciones. Debe permitir revision humana. Escenario 3: otorgante detecta riesgo jurisdiccional. Debe pedir evidencia y preparar pregunta de comite. Escenario 4: admin detecta fuente condicional. Debe marcar limitacion y evitar presentarla como live. Escenario 5: agente no tiene contexto. Debe decir que no cuenta con evidencia suficiente.'))
 out.append(sec('11. Errores frecuentes y manejo esperado', b(['Documento subido en categoria incorrecta: marcar observacion y pedir reclasificacion','Modelo financiero desactualizado: pedir nueva version','Ubicacion incompleta: bloquear analisis jurisdiccional profundo','Beneficiario final no identificado: marcar riesgo critico','Fuente regulatoria privada sin convenio: mostrar pendiente, no live','Otorgante sin autorizacion: denegar acceso','Correo con evidencia sensible: bloquear envio por defecto'])))
 out.append(sec('12. Resultado por seccion', b(['Pagina publica: entendimiento comercial','Solicitante: expediente preparado','Documentos: evidencia clasificada','Readiness: brechas visibles','Otorgante: paquete de decision no vinculante','Case management: seguimiento y SLA','Jurisdiccion: contexto pais/ciudad trazable','Admin: control operativo','Agente: asistencia limitada por contexto','Notificaciones: movimiento operativo sin exponer evidencia'])))
 return ''.join(out)

def tech_annex():
 out=[]
 out.append(sec('14. Contratos de servicio esperados', 'Cada servicio backend debe tener entrada, salida, errores controlados y logs. La salida debe ser JSON trazable y no debe depender de textos ambiguos.'))
 services=['jurisdiction-readiness','grantor-jurisdiction-evidence','operational-persistence-plan','conversation-agent-readiness','notification-approval-plan','document-provenance','case-events']
 for s in services:
  out.append(sub('Contrato '+s, 'Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.'))
 out.append(sec('15. Matriz RLS tecnica', 'RLS debe probarse por tabla y rol.\n\n'+b(['applicant can select own files only','applicant cannot select other applicant files','grantor can select authorized data rooms only','grantor cannot select unshared documents','admin can access operational panels only with privileged role','service role writes require explicit backend gate','agent context query must apply same filters as user role'])))
 out.append(sec('16. Variables y compuertas', b(['NUXERA_WRITE_ENABLED controla escrituras reales','NOTIFICATION_DRY_RUN controla envio','AGENT_RUNTIME_ENABLED controla chat live','SOURCE_PRIVATE_CONNECTORS_ENABLED controla APIs privadas','RLS_PHASE2_VERIFIED documenta evidencia antes de cutover','BACKEND_HEALTH_REQUIRED bloquea demo API si Render no responde'])))
 out.append(sec('17. Observabilidad ampliada', b(['traceId por request','userId y role en logs seguros','latencia por endpoint','errores por proveedor IA','eventos de notificacion','fallas de correo','fuentes consultadas','limitaciones devueltas','intentos de acceso denegado','metricas de cold start backend'])))
 out.append(sec('18. Plan de hardening', n(['agregar pruebas RLS con tokens staging','ejecutar migraciones en entorno no productivo','activar sandbox correo','probar agente con contexto filtrado','agregar health checks programados','documentar rollback','preparar seed de casos demo','validar ausencia de Nexus en rutas principales','bloquear rutas legacy o redirigirlas','preparar checklist go/no-go'])))
 return ''.join(out)

def qa_annex():
 out=[]
 out.append(sec('9. Matriz extendida de pruebas manuales', 'La siguiente matriz debe ejecutarse antes de produccion real.'))
 cases=['login solicitante','login otorgante','login admin','crear expediente','editar empresa','cargar documento','observar documento','reemplazar version','calcular readiness','compartir data room','denegar otorgante no autorizado','generar decision memo','analizar pais ciudad','consultar fuente EAU','enviar dry-run correo','enviar sandbox correo','preguntar agente solicitante','preguntar agente otorgante','probar fallback IA','validar rollback']
 for c in cases:
  out.append(sub('Caso '+c, 'Pasos: '+n(['preparar usuario/contexto','ejecutar accion','registrar resultado visible','validar permisos','validar evento/log','capturar evidencia'])+'\n\nEsperado: resultado correcto sin fuga de datos, sin Nexus visible y con limitaciones claras si aplica.'))
 out.append(sec('10. Evidencia que debe guardarse', b(['captura antes/despues','usuario/rol usado','URL','fecha/hora','resultado esperado','resultado obtenido','logs relevantes','id de expediente demo','limitaciones','decision go/no-go'])))
 return ''.join(out)

def rem_annex():
 out=[]
 out.append(sec('6. Roadmap operativo por semanas', n(['Semana 1: RLS staging y SQL rehearsal','Semana 2: sandbox correo y agente con contexto','Semana 3: fuentes jurisdiccionales y EAU priorizadas','Semana 4: cutover controlado y monitoreo','Semana 5: pilotos con datos limitados','Semana 6: retroalimentacion, hardening y produccion limitada'])))
 out.append(sec('7. Checklist final de produccion', b(['RLS verificado','SQL migrado y probado','correo sandbox aprobado','plantillas aprobadas','agente restringido por rol','backend estable','fuentes privadas marcadas correctamente','Nexus redirigido','rollback listo','manuales actualizados','demo script listo','monitoreo activo'])))
 out.append(sec('8. Decision ejecutiva', 'La recomendacion es avanzar con presentacion a inversionistas, pero no vender como produccion plenamente automatizada hasta cerrar RLS, SQL, correo, agentes y backend estable. La narrativa correcta es: plataforma viva, producto demostrable, controles disenados y roadmap claro de produccion.'))
 return ''.join(out)
updates={
'NUXERA_MANUAL_FUNCIONAL_DETALLADO_2026-07-29_ES.md':functional_annex(),
'NUXERA_DETAILED_FUNCTIONAL_MANUAL_2026-07-29_EN.md':functional_annex(),
'NUXERA_MANUAL_TECNICO_DETALLADO_2026-07-29_ES.md':tech_annex(),
'NUXERA_DETAILED_TECHNICAL_MANUAL_2026-07-29_EN.md':tech_annex(),
'NUXERA_PRUEBAS_Y_EVIDENCIA_VISUAL_2026-07-29_ES.md':qa_annex(),
'NUXERA_TESTING_AND_VISUAL_EVIDENCE_2026-07-29_EN.md':qa_annex(),
'NUXERA_LO_QUE_FALTA_REALMENTE_2026-07-29_ES.md':rem_annex(),
'NUXERA_REAL_REMAINING_WORK_2026-07-29_EN.md':rem_annex(),
}
for name,add in updates.items():
 p=root/name
 p.write_text(p.read_text(encoding='utf-8')+'\n'+add,encoding='utf-8')
 print(name, len(p.read_text(encoding='utf-8')))
