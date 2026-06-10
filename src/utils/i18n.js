import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  "es": {
    "translation": {
      "navbar": {
        "home": "Inicio",
        "about": "Nosotros",
        "services": "Módulos",
        "profServices": "Servicios",
        "modules": "Módulos",
        "prices": "Planes",
        "contact": "FAQ",
        "login": "Acceder",
        "logout": "Cerrar sesión",
        "dashboard": "Dashboard",
        "platform": "Plataforma de Cumplimiento — Accesar",
        "security": "Seguridad",
        "international": "Internacional",
        "servicesFiles": "Servicios / Expedientes",
        "brandTagline": "Compliance + NSD IF"
      },
      "hero": {
        "title": "Plataforma Global de Cumplimiento y Acceso a Crédito",
        "description": "Infraestructura tecnológica B2B que centraliza expedientes, análisis de riesgo y verificación de identidad. Conectamos solicitantes corporativos con una sólida Red de Fondeo Internacional.",
        "cta1": "Agendar Demo",
        "cta2": "Ver Módulos",
        "imagePlaceholder": "Imagen corporativa — Próximamente"
      },
      "principles": {
        "traceability": {
          "title": "Trazabilidad",
          "desc": "Cada acción dentro de la plataforma queda registrada con fecha, usuario y detalle. Esto permite reconstruir el historial de cualquier expediente ante una auditoría, cumpliendo con las exigencias de la CNBV, UIF y reguladores internacionales."
        },
        "confidentiality": {
          "title": "Confidencialidad",
          "desc": "La información financiera y documental se maneja bajo estándares de cifrado AES-256 y protocolos de acceso basados en roles (RBAC). Solo el personal autorizado puede visualizar datos sensibles, garantizando el secreto bancario y la protección de datos personales."
        },
        "docControl": {
          "title": "Control Documental",
          "desc": "Gestión integral del ciclo de vida de cada documento: carga, validación, vigencia, versionado y archivo definitivo. El sistema detecta automáticamente documentos vencidos o faltantes y genera alertas proactivas al oficial de cumplimiento."
        },
        "visibleRisk": {
          "title": "Riesgo Visible",
          "desc": "Matriz de riesgo configurable que evalúa factores documentales, fiscales, reputacionales, geográficos y operativos. Asigna un NSD Risk Score estandarizado (1-100) que permite clasificar y priorizar casos de manera objetiva y auditable."
        },
        "evidence": {
          "title": "Evidencia",
          "desc": "Todo hallazgo, observación o decisión se documenta como evidencia formal dentro del expediente digital. Las notas de revisión, capturas de pantalla y resultados de consultas a listas restrictivas quedan vinculados al caso correspondiente."
        },
        "audit": {
          "title": "Auditoría",
          "desc": "La plataforma genera reportes consolidados listos para presentar ante auditores internos, externos y autoridades regulatorias. Incluye bitácora de accesos, historial de cambios y exportación en formatos estándar (PDF, CSV, XML)."
        }
      },
      "differentiators": {
        "subtitle": "PRINCIPIOS DE PRODUCTO",
        "mainTitle": "Cumplimiento operativo de punta a punta"
      },
      "security": {
        "subtitle": "SEGURIDAD Y PRIVACIDAD",
        "title": "Infraestructura Preparada para Auditorías Financieras",
        "desc": "Las entidades financieras exigen los más altos estándares de reserva y control de la información. Nuestra plataforma fue diseñada desde su arquitectura para cumplir con cada uno de esos requisitos.",
        "encryption": {
          "title": "Cifrado de Extremo a Extremo",
          "desc": "Toda la información financiera y documental se transmite y almacena bajo cifrado AES-256. Los datos en tránsito están protegidos con TLS 1.3 de grado bancario."
        },
        "rbac": {
          "title": "Control de Acceso Basado en Roles",
          "desc": "Arquitectura RBAC que garantiza que solo el personal autorizado accede a datos sensibles. Cada nivel de usuario tiene permisos granulares auditables por rol, departamento y jurisdicción."
        },
        "auditLog": {
          "title": "Bitácora Inmutable de Auditoría",
          "desc": "Registro cronológico de cada acción: accesos, modificaciones, descargas y aprobaciones. Preparado para inspecciones de la CNBV, UIF, OFAC y auditores externos bajo estándares ISO 27001."
        },
        "compliance": {
          "title": "Cumplimiento Regulatorio Multinacional",
          "desc": "Diseñada para satisfacer los requisitos de PLD/FT, Ley Federal de Protección de Datos Personales (LFPDPPP), GDPR europeo y estándares internacionales de privacidad financiera."
        }
      },
      "integrations": {
        "banner": "Conectados con las principales fuentes de verificación regulatoria"
      },
      "dashboard": {
        "title": "Dashboard",
        "solicitantes": "Gestión de Solicitantes",
        "cumplimiento": "Expedientes",
        "misProyectos": "Casos",
        "otorgantes": "Red de Fondeo",
        "perfil": "Mi perfil",
        "tabs": {
          "financialProfile": "Mi Perfil Financiero",
          "uploadProject": "Subir Proyecto / IA",
          "matches": "Instituciones Compatibles",
          "servicesFiles": "Servicios / Expedientes",
          "biometrics": "Biométricos",
          "command": "Command Center",
          "pipeline": "Oportunidades / Data Room",
          "analytics": "Inteligencia y Riesgo",
          "adminServices": "Gestión de Servicios",
          "commissions": "Comisiones y Cierres"
        },
        "sidebar": {
          "applicantCompany": "Empresa Solicitante",
          "funderEntity": "Fondo / Institución",
          "admin": "NSD Admin",
          "navigation": "Navegación",
          "switchDemo": "Cambiar perfil demo",
          "applicant": "Solicitante",
          "funder": "Otorgante"
        },
        "command": {
          "role": "Entidad financiera / Capital partner",
          "title": "Opportunity Command Center",
          "riskExposure": "Exposición de riesgo",
          "controlled": "Controlada",
          "sourceTitle": "Cómo se alimenta este centro",
          "source": {
            "pipeline": "Pipeline",
            "pipelineDemo": "Datos demo locales enriquecidos",
            "pipelineApi": "Supabase: otorganteAPI.pipeline()",
            "scores": "Scores",
            "scoresValue": "financialScore, complianceScore y scoring NSD del expediente",
            "dataRoom": "Data room",
            "dataRoomValue": "documentos, shares, permisos y requerimientos",
            "actions": "Acciones",
            "actionsValue": "interés institucional, memo, contacto y solicitudes"
          },
          "criticalTasks": "TAREAS CRÍTICAS",
          "stats": {
            "review": "Oportunidades por revisar",
            "dataRooms": "Data rooms abiertos",
            "highRisk": "Prospectos en riesgo alto",
            "readyReports": "Reportes listos para comité"
          },
          "priority": "OPORTUNIDADES PRIORITARIAS",
          "noOpportunities": "No hay oportunidades cargadas.",
          "funderFlow": "FLUJO DEL OTORGANTE",
          "flow": [
            [
              "1",
              "Revisar pipeline",
              "Filtrar por apetito, ticket, riesgo y preparación."
            ],
            [
              "2",
              "Abrir data room",
              "Consultar documentos, score y reporte ejecutivo."
            ],
            [
              "3",
              "Pedir información",
              "Solicitar aclaraciones con evidencia trazable."
            ],
            [
              "4",
              "Comité / contacto",
              "Generar memo y pedir contacto autorizado."
            ]
          ],
          "internationalLayer": "CAPA INTERNACIONAL",
          "internationalDesc": "Esta sección viene del análisis de implementación internacional. Sirve para preparar el producto por mercados sin lanzar todo a la vez."
        }
      },
      "messages": {
        "loading": "Cargando...",
        "error": "Error",
        "success": "Exitoso",
        "warning": "Advertencia",
        "noData": "Sin datos",
        "session": "Sesión activa"
      },
      "auth": {
        "startingDemo": "Iniciando demo...",
        "redirectingLogin": "Redirigiendo a login..."
      },
      "footer": {
        "description": "Compliance SaaS y servicios profesionales NSD IF para crédito, capital y fondeo institucional.",
        "navigation": "Navegación",
        "platform": "Plataforma",
        "legal": "Legal",
        "contact": "Contacto",
        "access": "Acceso",
        "applicants": "Solicitantes",
        "funders": "Otorgantes",
        "privacy": "Privacidad",
        "terms": "Términos",
        "city": "Ciudad de México",
        "rights": "© 2026 NSD Platform. Todos los derechos reservados."
      },
      "blog": {
        "title": "Blog y Recursos",
        "subtitle": "Guías sobre KYC/KYB, expedientes, auditoría, privacidad y operaciones de cumplimiento.",
        "categories": {
          "todos": "Todos",
          "compliance": "Cumplimiento",
          "expedientes": "Expedientes",
          "seguridad": "Seguridad",
          "tendencias": "Tendencias"
        },
        "articles": [
          {
            "title": "Cómo preparar un expediente auditable",
            "excerpt": "Criterios prácticos para reducir observaciones y acelerar revisiones internas.",
            "category": "expedientes",
            "date": "15 mayo 2026",
            "readTime": "5 min"
          },
          {
            "title": "Guía completa: KYC/KYB para empresas",
            "excerpt": "Flujos, documentos y controles para evaluar personas, empresas y beneficiarios finales.",
            "category": "compliance",
            "date": "12 mayo 2026",
            "readTime": "8 min"
          },
          {
            "title": "5 errores comunes en revisión documental",
            "excerpt": "Hallazgos frecuentes que generan retrasos, riesgo operativo o retrabajo.",
            "category": "expedientes",
            "date": "10 mayo 2026",
            "readTime": "6 min"
          },
          {
            "title": "Tendencias de cumplimiento 2026",
            "excerpt": "Automatización, trazabilidad y evidencia como base de equipos compliance modernos.",
            "category": "tendencias",
            "date": "8 mayo 2026",
            "readTime": "10 min"
          },
          {
            "title": "Privacidad y auditoría: controles mínimos",
            "excerpt": "Buenas prácticas para operar con datos sensibles, bitácoras y accesos por rol.",
            "category": "seguridad",
            "date": "5 mayo 2026",
            "readTime": "12 min"
          }
        ],
        "reading": "lectura",
        "newsletterTitle": "Recibe nuestro newsletter",
        "newsletterText": "Buenas prácticas de cumplimiento directamente en tu inbox.",
        "emailPlaceholder": "tu@email.com",
        "subscribe": "Suscribirse"
      },
      "certifications": {
        "title": "Certificaciones y Cumplimiento",
        "subtitle": "NSD cumple con los más altos estándares internacionales de seguridad y privacidad.",
        "certificationsTitle": "Certificaciones",
        "certified": "Certificado",
        "certs": [
          {
            "name": "ISO 27001",
            "desc": "Seguridad de la Información",
            "year": "2024"
          },
          {
            "name": "GDPR",
            "desc": "Regulación de Protección de Datos (UE)",
            "year": "2024"
          },
          {
            "name": "LGPD",
            "desc": "Ley General de Protección de Datos (Brasil)",
            "year": "2024"
          },
          {
            "name": "SOC 2 Type II",
            "desc": "Auditoría de Seguridad",
            "year": "2025"
          }
        ],
        "regulatoryTitle": "Marcos Regulatorios",
        "regulators": [
          {
            "title": "CNBV",
            "desc": "Comisión Nacional Bancaria y de Valores"
          },
          {
            "title": "SAT",
            "desc": "Servicio de Administración Tributaria"
          },
          {
            "title": "Banxico",
            "desc": "Banco de México"
          },
          {
            "title": "CONDUSEF",
            "desc": "Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros"
          }
        ],
        "securityTitle": "Medidas de Seguridad",
        "measures": [
          {
            "icon": "🔐",
            "title": "Encriptación",
            "desc": "SSL/TLS en tránsito"
          },
          {
            "icon": "🛡️",
            "title": "Firewall",
            "desc": "Protección de perímetro"
          },
          {
            "icon": "🔒",
            "title": "Control de Acceso",
            "desc": "Autenticación segura"
          },
          {
            "icon": "📋",
            "title": "Auditorías",
            "desc": "Revisiones regulares"
          },
          {
            "icon": "⚡",
            "title": "Backup",
            "desc": "Respaldos diarios"
          },
          {
            "icon": "🚨",
            "title": "Alertas",
            "desc": "Monitoreo 24/7"
          }
        ]
      },
      "forApplicants": {
        "eyebrow": "Para solicitantes",
        "title": "Llega mejor preparado antes de pedir financiamiento.",
        "description": "NSD IF ayuda a ordenar, validar y fortalecer tu expediente antes de abrirlo a bancos, fondos, SOFOMES, fintechs o capital partners. No promete aprobación; reduce fricción y mejora la calidad de presentación.",
        "steps": [
          [
            "Diagnóstico",
            "Captura proyecto, monto, uso de fondos, sector y etapa."
          ],
          [
            "Expediente",
            "Carga documentos, matriz de requisitos y data room."
          ],
          [
            "Revisión IA",
            "Detecta faltantes, inconsistencias, vigencias y riesgos."
          ],
          [
            "Subsanación",
            "Corrige brechas antes de presentarte a otorgantes."
          ],
          [
            "Presentación",
            "Comparte expediente bajo permisos, trazabilidad y consentimiento."
          ]
        ],
        "deliverablesTitle": "Qué recibe el solicitante",
        "deliverables": [
          [
            "Checklist vivo",
            "Requisitos por tipo de financiamiento, etapa, sector y monto solicitado."
          ],
          [
            "Semáforo A-E",
            "Lectura ejecutiva de preparación documental, riesgos y puntos bloqueantes."
          ],
          [
            "Data room",
            "Expediente ordenado para compartir con permisos, vigencia y trazabilidad."
          ],
          [
            "Plan de subsanación",
            "Acciones concretas para cerrar brechas antes de presentar el proyecto."
          ]
        ],
        "next": "Siguiente paso",
        "ctaTitle": "Crear expediente y preparar proyecto",
        "ctaText": "El flujo recomendado es cargar proyecto, documentos base y permitir que NSD IF marque faltantes antes de abrirlo a otorgantes.",
        "ctaButton": "Ver servicios"
      },
      "forFunders": {
        "eyebrow": "Para otorgantes",
        "title": "Revisa proyectos mejor preparados, con evidencia y trazabilidad.",
        "description": "NSD IF no sustituye tus políticas internas. Te entrega expedientes más comparables, data rooms ordenados, scoring explicable, requerimientos trazables y memo de comité para acelerar la primera lectura.",
        "controls": [
          [
            "Pipeline filtrable",
            "Sector, ticket, riesgo, región, estructura y preparación."
          ],
          [
            "Data room seguro",
            "Documentos organizados, permisos, expiración y bitácora."
          ],
          [
            "Mesa institucional",
            "Score, riesgos, requerimientos, gates y recomendación."
          ],
          [
            "Requerimientos",
            "Solicitudes de información con evidencia trazable."
          ],
          [
            "Memo de comité",
            "Paquete ejecutivo descargable para decisión interna."
          ]
        ],
        "flowTitle": "Flujo operativo del otorgante",
        "flow": [
          [
            "1. Detectar",
            "Filtra oportunidades por sector, ticket, país, estructura, score y disponibilidad documental."
          ],
          [
            "2. Revisar",
            "Consulta resumen ejecutivo, data room, brechas, red flags, evidencias y cambios recientes."
          ],
          [
            "3. Solicitar",
            "Pide información adicional con trazabilidad, responsable, vencimiento y estado de respuesta."
          ],
          [
            "4. Decidir",
            "Lleva al comité un memo compacto con recomendación, supuestos, riesgos y siguientes pasos."
          ]
        ],
        "signalsTitle": "Señales que debe poder leer el otorgante",
        "signalsText": "El módulo no debe quedarse en gráficas. La lectura útil para instituciones es una combinación de evidencia, brechas, score explicable y decisionabilidad.",
        "signals": [
          [
            "Riesgo documental",
            "Documentos vencidos, faltantes, inconsistentes o sin soporte suficiente."
          ],
          [
            "Riesgo operativo",
            "Uso de fondos poco claro, dependencia de clientes, etapa temprana o capacidad limitada."
          ],
          [
            "Riesgo legal",
            "Beneficiario controlador, poderes, contratos, garantías y cumplimiento corporativo."
          ],
          [
            "Riesgo internacional",
            "Moneda, jurisdicción, regulador, tratamiento de datos y requisitos transfronterizos."
          ]
        ],
        "institutionalView": "Vista institucional",
        "ctaTitle": "Entrar al dashboard de otorgantes",
        "ctaText": "En el producto interno, estas señales se conectan con oportunidades, data room, solicitudes de información y memo de comité.",
        "ctaButton": "Abrir dashboard"
      },
      "internationalPage": {
        "eyebrow": "NSD IF internacional",
        "title": "Expansión internacional por fases, no por impulso.",
        "description": "La plataforma se prepara primero para México + USA: formatos, moneda, foco regulatorio, data room, scoring explicable y disclaimers. Canadá, UK y otros mercados deben entrar después de validar pilotos, costos y revisión legal.",
        "routeTitle": "Ruta recomendada",
        "marketsTitle": "Mercados preparados localmente",
        "crossTitle": "Matriz de control transfronterizo",
        "crossText": "La expansión internacional debe proteger reputación y costos. Esta matriz indica dónde NSD IF puede operar como piloto, dónde solo preparar capacidades y dónde no conviene abrir sin revisión legal.",
        "checklistTitle": "Checklist antes de publicar internacional",
        "checklistText": "Esta lista mantiene el lanzamiento bajo control. NSD debe avanzar por validaciones, no por cantidad de países en el menú.",
        "launchPlan": [
          {
            "phase": "MVP internacional",
            "markets": "México + USA",
            "status": "Recomendado",
            "scope": "Copy, formatos, data room, disclaimers y scoring explicable para pilotos controlados."
          },
          {
            "phase": "Expansión inicial",
            "markets": "Canadá + UK",
            "status": "Después del piloto",
            "scope": "Ajustes regulatorios, privacidad, formatos legales y validaciones por mercado."
          },
          {
            "phase": "Escalamiento selectivo",
            "markets": "Unión Europea y otros mercados",
            "status": "Revisión legal fuerte",
            "scope": "Activar solo con matriz regulatoria, tratamiento de datos y costos validados."
          }
        ],
        "checklist": [
          [
            "Copy por mercado",
            "Mensajes públicos y disclaimers ajustados a México + USA."
          ],
          [
            "Privacidad",
            "Aviso, consentimiento y tratamiento de datos sensibles por jurisdicción."
          ],
          [
            "Otorgantes",
            "Apetito institucional, tickets, sectores y requisitos por mercado."
          ],
          [
            "Data room",
            "Carpetas, permisos, evidencias, expiración y bitácora."
          ],
          [
            "Costos",
            "IA, KYC/KYB, biometría, storage y soporte por expediente."
          ],
          [
            "Piloto",
            "3 a 5 proyectos antes de abrir comercialmente."
          ]
        ],
        "crossBorder": [
          [
            "México",
            "Base operativa inicial",
            "MXN/USD, aviso de privacidad, KYC/KYB, data room y evidencia fiscal."
          ],
          [
            "Estados Unidos",
            "Piloto controlado",
            "Disclaimers, privacidad, verificación documental y límites por estado/sector."
          ],
          [
            "Canadá",
            "Observación",
            "Preparar moneda, lenguaje y privacidad antes de activar comercialmente."
          ],
          [
            "Unión Europea",
            "No abrir todavía",
            "Requiere revisión legal fuerte por datos personales, consentimiento y transferencias."
          ]
        ]
      },
      "securityPage": {
        "eyebrow": "Seguridad, privacidad y trazabilidad",
        "title": "Confianza institucional para expedientes financieros sensibles.",
        "description": "NSD debe operar como una plataforma de preparación, validación, cumplimiento, scoring y presentación de expedientes. La seguridad no es un adorno técnico: es el control que permite que solicitantes y otorgantes compartan información con orden, permisos y evidencia.",
        "controls": [
          {
            "title": "Permisos por rol",
            "text": "Cada solicitante, otorgante, analista, auditor o administrador debe operar con permisos delimitados por finalidad, expediente y etapa de revisión."
          },
          {
            "title": "Bitácora auditable",
            "text": "Las acciones críticas deben registrarse: carga, descarga, revisión, cambio de estado, scoring, autorización de data room y solicitudes de información."
          },
          {
            "title": "Data room controlado",
            "text": "El acceso a documentos sensibles debe depender de consentimiento, token, vigencia, alcance documental y registro de consulta."
          },
          {
            "title": "Continuidad operativa",
            "text": "La operación necesita respaldos, monitoreo, responsables, plan de recuperación, control de cambios y protocolo de incidentes."
          }
        ],
        "minimumTitle": "Controles mínimos antes de escalar",
        "minimumText": "Antes de abrir acceso amplio a otorgantes, NSD debe validar matriz de roles, políticas de documentos, revisión legal, respaldo de datos, protocolo de incidentes, monitoreo y reportes de auditoría.",
        "principlesTitle": "Principios operativos",
        "principles": [
          "NSD no sustituye el análisis interno del otorgante.",
          "La IA apoya clasificación, extracción y reporte; no debe decidir sola sobre información sensible.",
          "Los datos personales y documentos se tratan con minimización, confidencialidad y finalidad declarada.",
          "Los accesos críticos, secretos, respaldos y cambios deben revisarse de forma periódica."
        ]
      },
      "privacy": {
        "title": "Aviso de Privacidad",
        "updated": "Última actualización: 23 de mayo de 2026",
        "intro": "Este aviso es una base operativa para NSD Platform y debe ser revisado por asesoría legal antes de su publicación definitiva.",
        "sections": [
          [
            "1. Responsable del tratamiento",
            [
              "NSD Platform / NSD International Finance será responsable del tratamiento de datos personales conforme a la legislación mexicana aplicable en materia de protección de datos personales.",
              "Datos corporativos definitivos, RFC, domicilio fiscal y datos del oficial de privacidad deberán integrarse antes de publicación comercial."
            ]
          ],
          [
            "2. Datos que podemos tratar",
            [
              "Datos de identificación y contacto: nombre, email, teléfono, domicilio, RFC, CURP, identificaciones y datos fiscales.",
              "Datos corporativos: razón social, representantes legales, accionistas, beneficiarios finales, documentos constitutivos, poderes, contratos y evidencia corporativa.",
              "Datos financieros y del proyecto: estados financieros, flujo, deuda, garantías, uso de fondos, documentos de soporte, business plan, pitch deck y data room.",
              "Datos técnicos: IP, dispositivo, navegador, fecha, hora, eventos de sesión, logs de acceso, acciones en plataforma y bitácoras de auditoría."
            ]
          ],
          [
            "3. Datos sensibles y biométricos",
            [
              "Podremos tratar datos sensibles o de alto impacto cuando sean necesarios para identidad, antifraude, cumplimiento, validación documental, KYC/KYB o servicios profesionales.",
              "Cuando se activen biométricos, podrán tratarse rostro, prueba de vida, comparación contra identificación oficial, huella digital u otras señales de identidad, siempre sujeto a consentimiento y finalidades específicas.",
              "La plataforma debe privilegiar resultados, evidencias y trazabilidad sobre almacenamiento de datos biométricos crudos, salvo que sea necesario y legalmente procedente."
            ]
          ],
          [
            "4. Finalidades primarias",
            [
              "Crear y administrar cuentas, órdenes, pagos, expedientes y data rooms.",
              "Prestar servicios profesionales NSD IF y preparar expedientes para crédito, inversión, fondeo o revisión por otorgantes.",
              "Validar identidad, documentos, cumplimiento, antifraude, KYC/KYB, beneficiario final y requisitos exigibles.",
              "Permitir que otorgantes autorizados revisen data rooms, documentos y revisiones IA preliminares.",
              "Generar bitácoras, auditoría, trazabilidad, evidencia operativa y controles de seguridad."
            ]
          ],
          [
            "5. IA, automatización y analítica",
            [
              "Podremos usar IA, OCR, reglas automatizadas y analítica para clasificar documentos, detectar faltantes, inconsistencias, vigencias, riesgos o preparar observaciones.",
              "Los resultados automatizados no sustituyen revisión humana ni asesoría legal, fiscal, financiera o regulatoria.",
              "Podremos conservar registros de revisiones IA, scores, hallazgos, documentos revisados y fechas para auditoría y mejora del servicio."
            ]
          ],
          [
            "6. Transferencias y encargados",
            [
              "Podremos compartir información con proveedores de hosting, almacenamiento, pagos, email, seguridad, biometría, analítica, OCR, IA, firma electrónica y soporte técnico.",
              "Podremos transferir o permitir acceso a otorgantes, entidades financieras, asesores, auditores o terceros autorizados por el usuario o por contrato.",
              "También podremos revelar información ante requerimientos de autoridades competentes, auditorías, cumplimiento legal, prevención de fraude o defensa de derechos."
            ]
          ],
          [
            "7. Seguridad",
            [
              "Aplicamos medidas administrativas, técnicas y organizacionales razonables: cifrado en tránsito, almacenamiento privado, URLs temporales, control de acceso, rate limiting, headers de seguridad y bitácoras.",
              "Ningún sistema es absolutamente invulnerable. En caso de incidente relevante, se activarán procedimientos de contención, análisis, mitigación y notificación conforme corresponda."
            ]
          ],
          [
            "8. Retención y eliminación",
            [
              "Conservaremos datos durante la relación comercial y por los plazos necesarios para cumplimiento legal, contractual, auditoría, prevención de fraude, defensa jurídica o requerimientos regulatorios.",
              "El usuario puede solicitar eliminación, bloqueo o restricción cuando proceda. Algunos registros, bitácoras o evidencias podrán mantenerse por obligación legal o interés legítimo."
            ]
          ],
          [
            "9. Derechos ARCO y revocación",
            [
              "Puedes ejercer derechos de acceso, rectificación, cancelación u oposición, así como revocar consentimiento cuando legalmente proceda.",
              "Para solicitudes ARCO escribe a privacidad@nsd.com indicando nombre, medio de contacto, derecho que deseas ejercer y documentos para acreditar identidad o representación."
            ]
          ],
          [
            "10. Cambios al aviso",
            [
              "Podremos modificar este aviso por cambios legales, regulatorios, operativos o tecnológicos. La versión vigente estará disponible en la plataforma.",
              "Contacto de privacidad: privacidad@nsd.com. Domicilio, RFC y datos definitivos deberán integrarse antes de publicación comercial."
            ]
          ]
        ]
      },
      "legalPages": {},
      "common": {
        "mexicoCity": "Ciudad de México"
      },
      "terms": {
        "title": "Términos y Condiciones",
        "updated": "Última actualización: 23 de mayo de 2026",
        "intro": "Este documento es una base operativa para la plataforma. Debe ser revisado por asesoría legal antes de su publicación definitiva.",
        "sections": [
          [
            "1. Aceptación de términos",
            [
              "Al acceder y usar NSD Platform aceptas estos términos. Si actúas por cuenta de una empresa, declaras tener facultades suficientes para obligarla.",
              "NSD puede actualizar estos términos para reflejar cambios legales, operativos o tecnológicos. La versión vigente estará disponible en la plataforma."
            ]
          ],
          [
            "2. Descripción del servicio",
            [
              "NSD Platform combina herramientas SaaS de cumplimiento, data room, revisión documental, servicios profesionales NSD IF y flujos para solicitantes y otorgantes.",
              "La plataforma puede apoyar en preparación de expedientes, business plan, análisis financiero, pitch deck, revisión de requisitos, trazabilidad y acceso controlado para entidades financieras."
            ]
          ],
          [
            "3. Documentos, expediente y data room",
            [
              "El usuario puede cargar documentos financieros, legales, fiscales, corporativos, personales o del proyecto. El usuario es responsable de que dichos documentos sean auténticos, completos, vigentes y legalmente obtenidos.",
              "NSD puede revisar completitud, consistencia, formato, vigencia aparente y trazabilidad documental. NSD no garantiza la veracidad material de la información ni sustituye la debida diligencia de bancos, fondos, SOFOMES, fintechs, autoridades o asesores externos.",
              "Los accesos al data room pueden compartirse con otorgantes autorizados. El usuario reconoce que compartir un expediente implica permitir que el destinatario revise documentos, estados y resultados preliminares asociados."
            ]
          ],
          [
            "4. Uso de IA y resultados automatizados",
            [
              "NSD puede usar herramientas de IA, OCR, reglas de negocio o agentes automatizados para clasificar documentos, detectar faltantes, generar score preliminar, identificar inconsistencias y preparar observaciones.",
              "Los resultados de IA son auxiliares y preliminares. No constituyen asesoría legal, fiscal, financiera, crediticia o regulatoria definitiva. Toda decisión debe ser validada por personas autorizadas y asesores profesionales.",
              "El usuario acepta que la calidad de los resultados depende de la información cargada, su legibilidad, vigencia, estructura y completitud."
            ]
          ],
          [
            "5. Biométricos e identidad digital",
            [
              "Cuando se active el módulo biométrico, NSD podrá integrar proveedores especializados para prueba de vida, validación facial, comparación contra identificación oficial, huella digital u otras señales antifraude.",
              "La activación de biométricos requerirá consentimiento específico y finalidades claras. NSD procurará guardar resultados, evidencias y bitácoras, no datos biométricos crudos salvo que sea necesario, legal y consentido."
            ]
          ],
          [
            "6. Responsabilidades del usuario",
            [
              "Mantener la confidencialidad de credenciales, usar contraseñas seguras y notificar accesos no autorizados.",
              "No cargar información falsa, alterada, fraudulenta, ilícita o de terceros sin autorización.",
              "No evadir controles de seguridad, manipular bitácoras, realizar scraping, pruebas no autorizadas o uso abusivo de la plataforma.",
              "Responder por la veracidad, licitud y autorización de la información cargada o compartida."
            ]
          ],
          [
            "7. Responsabilidades de NSD",
            [
              "Prestar el servicio con esfuerzos comercialmente razonables, controles de seguridad, trazabilidad y administración de accesos.",
              "Mantener documentos y datos bajo medidas de confidencialidad y seguridad acordes con la etapa del producto y los proveedores utilizados.",
              "Registrar eventos relevantes como carga de documentos, visualizaciones, revisiones IA y accesos compartidos para fines de auditoría."
            ]
          ],
          [
            "8. Pagos, servicios profesionales y reembolsos",
            [
              "Los servicios profesionales, planes o expedientes pueden requerir pago previo o condiciones específicas de contratación.",
              "Los pagos se procesan mediante proveedores externos como Stripe. NSD no almacena datos completos de tarjeta.",
              "Los alcances, tiempos de entrega, revisiones incluidas y políticas de reembolso deberán confirmarse en la orden, propuesta o contrato aplicable."
            ]
          ],
          [
            "9. Confidencialidad, retención y eliminación",
            [
              "NSD tratará la información como confidencial, salvo autorización del usuario, requerimiento legal, autoridad competente, auditoría, cumplimiento regulatorio o defensa de derechos.",
              "La información podrá conservarse durante la relación comercial y por los plazos necesarios para cumplimiento legal, auditoría, evidencia contractual, prevención de fraude y defensa jurídica.",
              "El usuario podrá solicitar eliminación o restricción cuando proceda legalmente; algunas bitácoras o evidencias podrán conservarse si existe obligación o interés legítimo."
            ]
          ],
          [
            "10. Limitación de responsabilidad",
            [
              "NSD no garantiza aprobación de crédito, inversión, fondeo, autorización regulatoria ni decisión favorable de un otorgante.",
              "NSD no será responsable por rechazos, cambios de criterio de entidades financieras, información falsa proporcionada por usuarios, fallas de terceros, fuerza mayor o decisiones tomadas sin revisión profesional.",
              "En caso de detectar posible fraude, uso indebido o actividad ilícita, NSD podrá suspender cuentas, preservar evidencia y cooperar con autoridades cuando corresponda."
            ]
          ],
          [
            "11. Ley aplicable y contacto",
            [
              "Estos términos se rigen por las leyes de México. Cualquier controversia será atendida ante autoridades competentes conforme a la legislación aplicable.",
              "Contacto legal: legal@nsd.com. Domicilio, RFC y datos corporativos definitivos deberán integrarse antes de publicación comercial."
            ]
          ]
        ]
      }
    }
  },
  "en": {
    "translation": {
      "navbar": {
        "home": "Home",
        "about": "About Us",
        "services": "Modules",
        "profServices": "Services",
        "modules": "Modules",
        "prices": "Plans",
        "contact": "FAQ",
        "login": "Login",
        "logout": "Log Out",
        "dashboard": "Dashboard",
        "platform": "Compliance Platform — Access",
        "security": "Security",
        "international": "International",
        "servicesFiles": "Services / Compliance Files",
        "brandTagline": "Compliance + NSD IF"
      },
      "hero": {
        "title": "Global Compliance & Credit Access Platform",
        "description": "B2B technology infrastructure that centralizes compliance files, risk analysis, and identity verification. We connect corporate applicants with a solid International Funding Network.",
        "cta1": "Schedule Demo",
        "cta2": "View Modules",
        "imagePlaceholder": "Corporate image — Coming soon"
      },
      "principles": {
        "traceability": {
          "title": "Traceability",
          "desc": "Every action in the platform is recorded with date, user, and detail. This allows any compliance file history to be reconstructed during an audit, supporting CNBV, Mexican FIU, and international regulator expectations."
        },
        "confidentiality": {
          "title": "Confidentiality",
          "desc": "Financial and documentary information is handled under AES-256 encryption standards and role-based access protocols (RBAC). Only authorized personnel can view sensitive data, supporting banking secrecy and personal data protection."
        },
        "docControl": {
          "title": "Document Control",
          "desc": "End-to-end lifecycle management for each document: upload, validation, expiration, versioning, and final archiving. The system automatically detects expired or missing documents and generates proactive alerts for the compliance officer."
        },
        "visibleRisk": {
          "title": "Visible Risk",
          "desc": "Configurable risk matrix that evaluates documentary, tax, reputational, geographic, and operational factors. It assigns a standardized NSD Risk Score (1-100) to classify and prioritize cases objectively and auditable."
        },
        "evidence": {
          "title": "Evidence",
          "desc": "Every finding, observation, or decision is documented as formal evidence inside the digital compliance file. Review notes, screenshots, and restrictive list screening results remain linked to the relevant case."
        },
        "audit": {
          "title": "Audit",
          "desc": "The platform generates consolidated reports ready for internal auditors, external auditors, and regulatory authorities. It includes access logs, change history, and exports in standard formats (PDF, CSV, XML)."
        }
      },
      "differentiators": {
        "subtitle": "PRODUCT PRINCIPLES",
        "mainTitle": "End-to-End Operational Compliance"
      },
      "security": {
        "subtitle": "SECURITY & PRIVACY",
        "title": "Infrastructure Ready for Financial Audits",
        "desc": "Financial institutions demand the highest standards for information confidentiality and control. Our platform was designed from its architecture to meet those requirements.",
        "encryption": {
          "title": "End-to-End Encryption",
          "desc": "All financial and documentary information is transmitted and stored under AES-256 encryption. Data in transit is protected with bank-grade TLS 1.3."
        },
        "rbac": {
          "title": "Role-Based Access Control",
          "desc": "RBAC architecture ensures that only authorized personnel can access sensitive data. Every user level has granular permissions auditable by role, department, and jurisdiction."
        },
        "auditLog": {
          "title": "Immutable Audit Log",
          "desc": "Chronological record of every action: access, changes, downloads, and approvals. Prepared for CNBV, Mexican FIU, OFAC, and external auditor inspections under ISO 27001 standards."
        },
        "compliance": {
          "title": "Multinational Regulatory Compliance",
          "desc": "Designed to support AML/CFT, Mexico’s Federal Law on Personal Data Protection, European GDPR, and international financial privacy standards."
        }
      },
      "integrations": {
        "banner": "Connected to key regulatory verification sources"
      },
      "dashboard": {
        "title": "Dashboard",
        "solicitantes": "Applicant Management",
        "cumplimiento": "Compliance Files",
        "misProyectos": "Cases",
        "otorgantes": "Funding Network",
        "perfil": "My profile",
        "tabs": {
          "financialProfile": "My Financial Profile",
          "uploadProject": "Upload Project / AI",
          "matches": "Compatible Institutions",
          "servicesFiles": "Services / Compliance Files",
          "biometrics": "Biometrics",
          "command": "Command Center",
          "pipeline": "Opportunities / Data Room",
          "analytics": "Intelligence & Risk",
          "adminServices": "Service Management",
          "commissions": "Commissions & Closings"
        },
        "sidebar": {
          "applicantCompany": "Applicant Company",
          "funderEntity": "Fund / Institution",
          "admin": "NSD Admin",
          "navigation": "Navigation",
          "switchDemo": "Switch demo profile",
          "applicant": "Applicant",
          "funder": "Funding Provider"
        },
        "command": {
          "role": "Financial institution / Capital partner",
          "title": "Opportunity Command Center",
          "riskExposure": "Risk exposure",
          "controlled": "Controlled",
          "sourceTitle": "How this center is fed",
          "source": {
            "pipeline": "Pipeline",
            "pipelineDemo": "Enhanced local demo data",
            "pipelineApi": "Supabase: otorganteAPI.pipeline()",
            "scores": "Scores",
            "scoresValue": "financialScore, complianceScore, and NSD compliance file scoring",
            "dataRoom": "Data room",
            "dataRoomValue": "documents, shares, permissions, and requests",
            "actions": "Actions",
            "actionsValue": "institutional interest, memo, contact, and requests"
          },
          "criticalTasks": "CRITICAL TASKS",
          "stats": {
            "review": "Opportunities to review",
            "dataRooms": "Open data rooms",
            "highRisk": "High-risk prospects",
            "readyReports": "Reports ready for committee"
          },
          "priority": "PRIORITY OPPORTUNITIES",
          "noOpportunities": "No opportunities loaded.",
          "funderFlow": "FUNDER WORKFLOW",
          "flow": [
            [
              "1",
              "Review pipeline",
              "Filter by appetite, ticket size, risk, and readiness."
            ],
            [
              "2",
              "Open data room",
              "Review documents, score, and executive report."
            ],
            [
              "3",
              "Request information",
              "Ask for clarifications with traceable evidence."
            ],
            [
              "4",
              "Committee / contact",
              "Generate memo and request authorized contact."
            ]
          ],
          "internationalLayer": "INTERNATIONAL LAYER",
          "internationalDesc": "This section comes from the international implementation analysis. It helps prepare the product by market without launching everything at once."
        }
      },
      "messages": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "warning": "Warning",
        "noData": "No data",
        "session": "Active session"
      },
      "auth": {
        "startingDemo": "Starting demo...",
        "redirectingLogin": "Redirecting to login..."
      },
      "footer": {
        "description": "Compliance SaaS and NSD IF professional services for credit, capital, and institutional funding.",
        "navigation": "Navigation",
        "platform": "Platform",
        "legal": "Legal",
        "contact": "Contact",
        "access": "Access",
        "applicants": "Applicants",
        "funders": "Funding Providers",
        "privacy": "Privacy",
        "terms": "Terms",
        "city": "Mexico City",
        "rights": "© 2026 NSD Platform. All rights reserved."
      },
      "blog": {
        "title": "Blog & Resources",
        "subtitle": "Guides on KYC/KYB, compliance files, audits, privacy, and compliance operations.",
        "categories": {
          "todos": "All",
          "compliance": "Compliance",
          "expedientes": "Compliance Files",
          "seguridad": "Security",
          "tendencias": "Trends"
        },
        "articles": [
          {
            "title": "How to Prepare an Auditable Compliance File",
            "excerpt": "Practical criteria to reduce observations and accelerate internal reviews.",
            "category": "compliance files",
            "date": "May 15, 2026",
            "readTime": "5 min"
          },
          {
            "title": "Complete Guide: KYC/KYB for Companies",
            "excerpt": "Flows, documents, and controls to evaluate individuals, companies, and ultimate beneficial owners.",
            "category": "compliance",
            "date": "May 12, 2026",
            "readTime": "8 min"
          },
          {
            "title": "5 Common Mistakes in Document Review",
            "excerpt": "Frequent findings that create delays, operational risk, or rework.",
            "category": "compliance files",
            "date": "May 10, 2026",
            "readTime": "6 min"
          },
          {
            "title": "Compliance Trends 2026",
            "excerpt": "Automation, traceability, and evidence as the foundation of modern compliance teams.",
            "category": "trends",
            "date": "May 8, 2026",
            "readTime": "10 min"
          },
          {
            "title": "Privacy and Audit: Minimum Controls",
            "excerpt": "Best practices for operating with sensitive data, logs, and role-based access.",
            "category": "security",
            "date": "May 5, 2026",
            "readTime": "12 min"
          }
        ],
        "reading": "read",
        "newsletterTitle": "Receive our newsletter",
        "newsletterText": "Compliance best practices delivered directly to your inbox.",
        "emailPlaceholder": "you@email.com",
        "subscribe": "Subscribe"
      },
      "certifications": {
        "title": "Certifications & Compliance",
        "subtitle": "NSD meets high international standards for security and privacy.",
        "certificationsTitle": "Certifications",
        "certified": "Certified",
        "certs": [
          {
            "name": "ISO 27001",
            "desc": "Information Security",
            "year": "2024"
          },
          {
            "name": "GDPR",
            "desc": "Data Protection Regulation (EU)",
            "year": "2024"
          },
          {
            "name": "LGPD",
            "desc": "General Data Protection Law (Brazil)",
            "year": "2024"
          },
          {
            "name": "SOC 2 Type II",
            "desc": "Security Audit",
            "year": "2025"
          }
        ],
        "regulatoryTitle": "Regulatory Frameworks",
        "regulators": [
          {
            "title": "CNBV",
            "desc": "Mexican National Banking and Securities Commission"
          },
          {
            "title": "SAT",
            "desc": "Mexican Tax Authority"
          },
          {
            "title": "Banxico",
            "desc": "Bank of Mexico"
          },
          {
            "title": "CONDUSEF",
            "desc": "Mexican Commission for the Protection and Defense of Financial Services Users"
          }
        ],
        "securityTitle": "Security Measures",
        "measures": [
          {
            "icon": "🔐",
            "title": "Encryption",
            "desc": "SSL/TLS in transit"
          },
          {
            "icon": "🛡️",
            "title": "Firewall",
            "desc": "Perimeter protection"
          },
          {
            "icon": "🔒",
            "title": "Access Control",
            "desc": "Secure authentication"
          },
          {
            "icon": "📋",
            "title": "Audits",
            "desc": "Regular reviews"
          },
          {
            "icon": "⚡",
            "title": "Backup",
            "desc": "Daily backups"
          },
          {
            "icon": "🚨",
            "title": "Alerts",
            "desc": "24/7 monitoring"
          }
        ]
      },
      "forApplicants": {
        "eyebrow": "For Applicants",
        "title": "Arrive better prepared before requesting financing.",
        "description": "NSD IF helps organize, validate, and strengthen your compliance file before opening it to banks, funds, SOFOMs, fintechs, or capital partners. It does not promise approval; it reduces friction and improves presentation quality.",
        "steps": [
          [
            "Diagnosis",
            "Capture the project, amount, use of funds, sector, and stage."
          ],
          [
            "Compliance File",
            "Upload documents, requirements matrix, and data room."
          ],
          [
            "AI Review",
            "Detect missing items, inconsistencies, expirations, and risks."
          ],
          [
            "Remediation",
            "Close gaps before presenting yourself to funding providers."
          ],
          [
            "Presentation",
            "Share the file under permissions, traceability, and consent."
          ]
        ],
        "deliverablesTitle": "What the applicant receives",
        "deliverables": [
          [
            "Live Checklist",
            "Requirements by financing type, stage, sector, and requested amount."
          ],
          [
            "A-E Traffic Light",
            "Executive view of document readiness, risks, and blocking points."
          ],
          [
            "Data room",
            "Organized compliance file ready to share with permissions, validity, and traceability."
          ],
          [
            "Remediation plan",
            "Concrete actions to close gaps before presenting the project."
          ]
        ],
        "next": "Next step",
        "ctaTitle": "Create compliance file and prepare project",
        "ctaText": "The recommended flow is to upload the project and base documents, then allow NSD IF to flag missing items before opening the file to funding providers.",
        "ctaButton": "View services"
      },
      "forFunders": {
        "eyebrow": "For Funding Providers",
        "title": "Review better-prepared projects, with evidence and traceability.",
        "description": "NSD IF does not replace your internal policies. It provides more comparable files, organized data rooms, explainable scoring, traceable requests, and committee memos to accelerate first review.",
        "controls": [
          [
            "Filterable pipeline",
            "Sector, ticket size, risk, region, structure, and readiness."
          ],
          [
            "Secure data room",
            "Organized documents, permissions, expiration, and audit log."
          ],
          [
            "Institutional desk",
            "Score, risks, requirements, gates, and recommendation."
          ],
          [
            "Requests",
            "Information requests with traceable evidence."
          ],
          [
            "Committee memo",
            "Downloadable executive package for internal decision-making."
          ]
        ],
        "flowTitle": "Funding provider operating flow",
        "flow": [
          [
            "1. Detect",
            "Filter opportunities by sector, ticket size, country, structure, score, and document availability."
          ],
          [
            "2. Review",
            "Check executive summary, data room, gaps, red flags, evidence, and recent changes."
          ],
          [
            "3. Request",
            "Ask for additional information with traceability, owner, due date, and response status."
          ],
          [
            "4. Decide",
            "Take a compact memo to committee with recommendation, assumptions, risks, and next steps."
          ]
        ],
        "signalsTitle": "Signals the funding provider must be able to read",
        "signalsText": "The module should not stop at charts. The useful institutional view combines evidence, gaps, explainable score, and decision-readiness.",
        "signals": [
          [
            "Document risk",
            "Expired, missing, inconsistent, or insufficiently supported documents."
          ],
          [
            "Operational risk",
            "Unclear use of funds, customer concentration, early stage, or limited capacity."
          ],
          [
            "Legal risk",
            "Ultimate beneficial owner, powers of attorney, contracts, collateral, and corporate compliance."
          ],
          [
            "Cross-border risk",
            "Currency, jurisdiction, regulator, data processing, and cross-border requirements."
          ]
        ],
        "institutionalView": "Institutional view",
        "ctaTitle": "Enter the funder dashboard",
        "ctaText": "In the internal product, these signals connect with opportunities, data room, information requests, and committee memo.",
        "ctaButton": "Open dashboard"
      },
      "internationalPage": {
        "eyebrow": "NSD IF International",
        "title": "International expansion by phases, not by impulse.",
        "description": "The platform prepares first for Mexico + USA: formats, currency, regulatory focus, data room, explainable scoring, and disclaimers. Canada, UK, and other markets should enter after pilots, costs, and legal review are validated.",
        "routeTitle": "Recommended route",
        "marketsTitle": "Locally prepared markets",
        "crossTitle": "Cross-border control matrix",
        "crossText": "International expansion must protect reputation and costs. This matrix indicates where NSD IF can operate as a pilot, where it should only prepare capabilities, and where it should not open without legal review.",
        "checklistTitle": "Checklist before international publishing",
        "checklistText": "This list keeps the launch under control. NSD should move forward through validations, not by the number of countries in the menu.",
        "launchPlan": [
          {
            "phase": "International MVP",
            "markets": "Mexico + USA",
            "status": "Recommended",
            "scope": "Copy, formats, data room, disclaimers, and explainable scoring for controlled pilots."
          },
          {
            "phase": "Initial expansion",
            "markets": "Canada + UK",
            "status": "After pilot",
            "scope": "Regulatory adjustments, privacy, legal formats, and market-specific validations."
          },
          {
            "phase": "Selective scaling",
            "markets": "European Union and other markets",
            "status": "Strong legal review",
            "scope": "Activate only with validated regulatory matrix, data processing, and cost model."
          }
        ],
        "checklist": [
          [
            "Market copy",
            "Public messages and disclaimers adjusted to Mexico + USA."
          ],
          [
            "Privacy",
            "Notice, consent, and sensitive data processing by jurisdiction."
          ],
          [
            "Funding providers",
            "Institutional appetite, ticket size, sectors, and requirements by market."
          ],
          [
            "Data room",
            "Folders, permissions, evidence, expiration, and audit log."
          ],
          [
            "Costs",
            "AI, KYC/KYB, biometrics, storage, and support per file."
          ],
          [
            "Pilot",
            "3 to 5 projects before opening commercially."
          ]
        ],
        "crossBorder": [
          [
            "Mexico",
            "Initial operating base",
            "MXN/USD, privacy notice, KYC/KYB, data room, and tax evidence."
          ],
          [
            "United States",
            "Controlled pilot",
            "Disclaimers, privacy, document verification, and limits by state/sector."
          ],
          [
            "Canada",
            "Observation",
            "Prepare currency, language, and privacy before commercial activation."
          ],
          [
            "European Union",
            "Do not open yet",
            "Requires strong legal review for personal data, consent, and transfers."
          ]
        ]
      },
      "securityPage": {
        "eyebrow": "Security, privacy, and traceability",
        "title": "Institutional trust for sensitive financial files.",
        "description": "NSD must operate as a platform for preparation, validation, compliance, scoring, and presentation of files. Security is not technical decoration: it is the control that allows applicants and funding providers to share information with order, permissions, and evidence.",
        "controls": [
          {
            "title": "Role-based permissions",
            "text": "Each applicant, funding provider, analyst, auditor, or administrator must operate with permissions limited by purpose, file, and review stage."
          },
          {
            "title": "Auditable log",
            "text": "Critical actions must be recorded: upload, download, review, status change, scoring, data room authorization, and information requests."
          },
          {
            "title": "Controlled data room",
            "text": "Access to sensitive documents must depend on consent, token, validity, document scope, and query record."
          },
          {
            "title": "Operational continuity",
            "text": "Operations require backups, monitoring, owners, recovery plan, change control, and incident protocol."
          }
        ],
        "minimumTitle": "Minimum controls before scaling",
        "minimumText": "Before opening broad access to funding providers, NSD must validate role matrix, document policies, legal review, data backups, incident protocol, monitoring, and audit reports.",
        "principlesTitle": "Operating principles",
        "principles": [
          "NSD does not replace the funding provider’s internal analysis.",
          "AI supports classification, extraction, and reporting; it must not make decisions alone on sensitive information.",
          "Personal data and documents are processed under minimization, confidentiality, and declared purpose.",
          "Critical access, secrets, backups, and changes must be reviewed periodically."
        ]
      },
      "privacy": {
        "title": "Privacy Notice",
        "updated": "Last updated: May 23, 2026",
        "intro": "This notice is an operating baseline for NSD Platform and must be reviewed by legal counsel before final publication.",
        "sections": [
          [
            "1. Data controller",
            [
              "NSD Platform / NSD International Finance will be responsible for processing personal data under applicable Mexican personal data protection law.",
              "Final corporate data, tax ID, fiscal address, and privacy officer information must be added before commercial publication."
            ]
          ],
          [
            "2. Data we may process",
            [
              "Identification and contact data: name, email, phone, address, tax ID, CURP, IDs, and tax data.",
              "Corporate data: legal name, legal representatives, shareholders, ultimate beneficial owners, incorporation documents, powers of attorney, contracts, and corporate evidence.",
              "Financial and project data: financial statements, cash flow, debt, collateral, use of funds, supporting documents, business plan, pitch deck, and data room.",
              "Technical data: IP, device, browser, date, time, session events, access logs, platform actions, and audit logs."
            ]
          ],
          [
            "3. Sensitive and biometric data",
            [
              "We may process sensitive or high-impact data when required for identity, anti-fraud, compliance, document validation, KYC/KYB, or professional services.",
              "When biometric modules are activated, face data, liveness checks, comparison against official ID, fingerprints, or other identity signals may be processed, always subject to consent and specific purposes.",
              "The platform should prioritize results, evidence, and traceability over storage of raw biometric data, unless necessary and legally appropriate."
            ]
          ],
          [
            "4. Primary purposes",
            [
              "Create and manage accounts, orders, payments, compliance files, and data rooms.",
              "Provide NSD IF professional services and prepare files for credit, investment, funding, or funding provider review.",
              "Validate identity, documents, compliance, anti-fraud controls, KYC/KYB, ultimate beneficial owner, and applicable requirements.",
              "Allow authorized funding providers to review data rooms, documents, and preliminary AI reviews.",
              "Generate logs, auditability, traceability, operating evidence, and security controls."
            ]
          ],
          [
            "5. AI, automation, and analytics",
            [
              "We may use AI, OCR, automated rules, and analytics to classify documents, detect missing items, inconsistencies, expirations, risks, or prepare observations.",
              "Automated results do not replace human review or legal, tax, financial, or regulatory advice.",
              "We may retain records of AI reviews, scores, findings, reviewed documents, and dates for audit and service improvement."
            ]
          ],
          [
            "6. Transfers and processors",
            [
              "We may share information with providers for hosting, storage, payments, email, security, biometrics, analytics, OCR, AI, e-signature, and technical support.",
              "We may transfer or allow access to funding providers, financial institutions, advisers, auditors, or third parties authorized by the user or contract.",
              "We may also disclose information in response to competent authority requests, audits, legal compliance, fraud prevention, or rights defense."
            ]
          ],
          [
            "7. Security",
            [
              "We apply reasonable administrative, technical, and organizational measures: encryption in transit, private storage, temporary URLs, access control, rate limiting, security headers, and logs.",
              "No system is absolutely invulnerable. In case of a relevant incident, containment, analysis, mitigation, and notification procedures will be activated as applicable."
            ]
          ],
          [
            "8. Retention and deletion",
            [
              "We will retain data during the commercial relationship and for the periods required for legal, contractual, audit, fraud prevention, legal defense, or regulatory purposes.",
              "The user may request deletion, blocking, or restriction when legally applicable. Some records, logs, or evidence may be retained due to legal obligation or legitimate interest."
            ]
          ],
          [
            "9. ARCO rights and consent withdrawal",
            [
              "You may exercise access, rectification, cancellation, or objection rights, and withdraw consent when legally applicable.",
              "For ARCO requests, write to privacidad@nsd.com indicating name, contact method, right to be exercised, and documents proving identity or representation."
            ]
          ],
          [
            "10. Notice changes",
            [
              "We may modify this notice due to legal, regulatory, operational, or technology changes. The current version will be available on the platform.",
              "Privacy contact: privacidad@nsd.com. Address, tax ID, and final corporate details must be added before commercial publication."
            ]
          ]
        ]
      },
      "legalPages": {},
      "common": {
        "mexicoCity": "Mexico City"
      },
      "terms": {
        "title": "Terms and Conditions",
        "updated": "Last updated: May 23, 2026",
        "intro": "This document is an operating baseline for the platform. It must be reviewed by legal counsel before final publication.",
        "sections": [
          [
            "1. Acceptance of terms",
            [
              "By accessing and using NSD Platform, you accept these terms. If you act on behalf of a company, you represent that you have sufficient authority to bind it.",
              "NSD may update these terms to reflect legal, operating, or technology changes. The current version will be available on the platform."
            ]
          ],
          [
            "2. Service description",
            [
              "NSD Platform combines compliance SaaS tools, data room, document review, NSD IF professional services, and workflows for applicants and funding providers.",
              "The platform may support file preparation, business plan, financial analysis, pitch deck, requirements review, traceability, and controlled access for financial institutions."
            ]
          ],
          [
            "3. Documents, compliance file, and data room",
            [
              "The user may upload financial, legal, tax, corporate, personal, or project documents. The user is responsible for ensuring that such documents are authentic, complete, current, and legally obtained.",
              "NSD may review completeness, consistency, format, apparent validity, and document traceability. NSD does not guarantee the material truthfulness of information and does not replace the due diligence of banks, funds, SOFOMs, fintechs, authorities, or external advisers.",
              "Data room access may be shared with authorized funding providers. The user acknowledges that sharing a file allows the recipient to review documents, statuses, and associated preliminary results."
            ]
          ],
          [
            "4. AI use and automated results",
            [
              "NSD may use AI tools, OCR, business rules, or automated agents to classify documents, detect missing items, generate a preliminary score, identify inconsistencies, and prepare observations.",
              "AI results are auxiliary and preliminary. They do not constitute definitive legal, tax, financial, credit, or regulatory advice. Every decision must be validated by authorized people and professional advisers.",
              "The user accepts that result quality depends on uploaded information, legibility, validity, structure, and completeness."
            ]
          ],
          [
            "5. Biometrics and digital identity",
            [
              "When the biometric module is activated, NSD may integrate specialized providers for liveness checks, facial validation, comparison against official ID, fingerprints, or other anti-fraud signals.",
              "Biometric activation will require specific consent and clear purposes. NSD will seek to store results, evidence, and logs, not raw biometric data unless necessary, legal, and consented."
            ]
          ],
          [
            "6. User responsibilities",
            [
              "Keep credentials confidential, use secure passwords, and report unauthorized access.",
              "Do not upload false, altered, fraudulent, unlawful information, or third-party information without authorization.",
              "Do not bypass security controls, manipulate logs, scrape, perform unauthorized testing, or abuse the platform.",
              "Be responsible for the truthfulness, legality, and authorization of information uploaded or shared."
            ]
          ],
          [
            "7. NSD responsibilities",
            [
              "Provide the service with commercially reasonable efforts, security controls, traceability, and access management.",
              "Keep documents and data under confidentiality and security measures aligned with the product stage and providers used.",
              "Record relevant events such as document uploads, views, AI reviews, and shared access for audit purposes."
            ]
          ],
          [
            "8. Payments, professional services, and refunds",
            [
              "Professional services, plans, or files may require prior payment or specific contracting conditions.",
              "Payments are processed through external providers such as Stripe. NSD does not store complete card data.",
              "Scope, delivery times, included reviews, and refund policies must be confirmed in the applicable order, proposal, or contract."
            ]
          ],
          [
            "9. Confidentiality, retention, and deletion",
            [
              "NSD will treat information as confidential, except with user authorization, legal requirement, competent authority, audit, regulatory compliance, or rights defense.",
              "Information may be retained during the commercial relationship and for periods required for legal compliance, audit, contractual evidence, fraud prevention, and legal defense.",
              "The user may request deletion or restriction when legally applicable; some logs or evidence may be retained if there is an obligation or legitimate interest."
            ]
          ],
          [
            "10. Limitation of liability",
            [
              "NSD does not guarantee approval of credit, investment, funding, regulatory authorization, or a favorable decision by a funding provider.",
              "NSD will not be responsible for rejections, financial institution criteria changes, false information provided by users, third-party failures, force majeure, or decisions made without professional review.",
              "If possible fraud, misuse, or illegal activity is detected, NSD may suspend accounts, preserve evidence, and cooperate with authorities when applicable."
            ]
          ],
          [
            "11. Governing law and contact",
            [
              "These terms are governed by the laws of Mexico. Any dispute will be handled before competent authorities under applicable law.",
              "Legal contact: legal@nsd.com. Address, tax ID, and final corporate data must be added before commercial publication."
            ]
          ]
        ]
      }
    }
  }
};

const initialLanguage = localStorage.getItem("language") || "es";
document.documentElement.lang = initialLanguage;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
  document.documentElement.lang = lng;
});

export default i18n;
