import { BRAND } from "../config/brand";

export const demoServiceOrders = [
  {
    id: "demo-order-001",
    service_type: "combo-complete",
    serviceName: "Paquete Completo",
    projectName: "Expediente Manufactura Norte",
    status: "paid",
    amount: 85000,
    case_number: "NSD-2026-DEMO001",
    stage: "revision_documental",
    readiness_grade: "B",
    risk_level: "medio",
    compliance_status: "en_revision",
    created_at: "2026-05-24T16:20:00.000Z",
    expectedDelivery: "2026-06-03",
    metadata: {
      sector: "Manufacturero",
      country: "MX",
      companyName: "Manufactura Norte S.A. de C.V.",
      description: "Expansion de linea de produccion, compra de maquinaria CNC y capital de trabajo para contratos firmados.",
      useOfFunds: "Maquinaria, inventario inicial, certificaciones y capital de trabajo.",
      guarantee: "Maquinaria, cesion de contratos y soporte de flujos.",
      targetEntity: "BANCA_COMERCIAL",
      structure: "Credito senior con garantia mobiliaria",
      readinessLevel: "Subsanable",
      financialScore: 78,
      complianceScore: 84,
      documents: ["Resumen ejecutivo", "Estados financieros 2024-2025", "Contrato de suministro", "KYC/KYB", "Garantia mobiliaria"],
      share: { status: "accepted", recipientName: "Banco / Mesa empresarial", acceptedAt: "2026-05-28T12:10:00.000Z" },
      interest: { status: "under_review", notes: "Atractivo para credito senior si se confirma margen y contrato.", created_at: "2026-05-29T09:20:00.000Z" },
      contactRequest: { status: "requested", created_at: "2026-05-30T11:30:00.000Z" },
      infoRequests: [
        { id: "demo-req-001", title: "Estados financieros auditados 2025", priority: "high", status: "open", document_type: "estados_financieros", created_at: "2026-05-29T10:00:00.000Z" },
        { id: "demo-req-002", title: "Detalle de contratos vigentes", priority: "medium", status: "resolved", document_type: "contrato", response: "Contrato maestro cargado en data room.", evidence_document_id: "demo-doc-contract", evidence: { filename: "contrato_suministro_2026.pdf" }, created_at: "2026-05-29T12:00:00.000Z" }
      ]
    }
  },
  {
    id: "demo-order-002",
    service_type: "financial-analysis",
    serviceName: "Analisis Financiero",
    projectName: "Linea Capital de Trabajo",
    status: "pending",
    amount: 42000,
    case_number: "NSD-2026-DEMO002",
    stage: "captura",
    readiness_grade: "pendiente",
    risk_level: "pendiente",
    compliance_status: "pendiente",
    created_at: "2026-05-25T13:45:00.000Z",
    expectedDelivery: "Pendiente",
    metadata: {
      sector: "Tecnologia / Startup",
      country: "US",
      companyName: "SaaS Ops Analytics LLC",
      description: "Linea de capital para expansion comercial B2B y contratacion de equipo de ventas.",
      useOfFunds: "Ventas enterprise, onboarding, infraestructura y capital de trabajo.",
      guarantee: "MRR, contratos SaaS y cesion limitada de cuentas por cobrar.",
      targetEntity: "FAMILY_OFFICE",
      structure: "Venture debt / revenue based financing",
      readinessLevel: "Preparacion inicial",
      financialScore: 61,
      complianceScore: 68,
      documents: ["Pitch deck", "Modelo financiero", "Cap table", "MRR dashboard", "KYC/KYB"],
      share: { status: "invited", recipientName: "Family office / Growth capital" },
      interest: { status: "interested", notes: "Revisar traccion, churn y runway antes de comite.", created_at: "2026-05-30T14:00:00.000Z" },
      infoRequests: [
        { id: "demo-req-003", title: "Desglose de MRR y churn", priority: "high", status: "open", document_type: "otro", created_at: "2026-05-30T15:00:00.000Z" }
      ]
    }
  },
  {
    id: "demo-order-003",
    service_type: "business-plan",
    serviceName: "Business Plan Profesional",
    projectName: "Expansion Agroindustrial",
    status: "completed",
    amount: 58000,
    case_number: "NSD-2026-DEMO003",
    stage: "cerrado",
    readiness_grade: "A",
    risk_level: "bajo",
    compliance_status: "aprobado_para_presentacion",
    created_at: "2026-05-19T10:10:00.000Z",
    expectedDelivery: "2026-05-24",
    metadata: {
      sector: "Agroindustrial",
      country: "MX",
      companyName: "Agroindustrial Bajio SPR",
      description: "Expansion de capacidad de empaque y preenfriado para exportacion.",
      useOfFunds: "Infraestructura productiva, certificaciones, equipo de frio y capital de cosecha.",
      guarantee: "Activo fijo, inventario, contratos de exportacion y seguro agricola.",
      targetEntity: "BANCA_DESARROLLO",
      structure: "Credito productivo con apoyo de banca de desarrollo",
      readinessLevel: "Listo para comite",
      financialScore: 89,
      complianceScore: 92,
      documents: ["Resumen ejecutivo", "Business plan", "Estados financieros", "Permisos y certificaciones", "Garantias", `Reporte ${BRAND.name}`],
      share: { status: "accepted", recipientName: "Banca desarrollo", acceptedAt: "2026-05-24T09:00:00.000Z" },
      interest: { status: "term_sheet", notes: "Perfil listo para propuesta indicativa.", created_at: "2026-05-25T13:00:00.000Z" },
      contactRequest: { status: "approved", created_at: "2026-05-25T15:30:00.000Z" },
      infoRequests: [
        { id: "demo-req-004", title: "Confirmacion de permisos de exportacion", priority: "low", status: "resolved", document_type: "otro", response: "Permisos cargados y validados.", evidence_document_id: "demo-doc-permits", evidence: { filename: "permisos_exportacion.pdf" }, created_at: "2026-05-24T14:00:00.000Z" }
      ]
    }
  }
];

export function mapServiceOrder(order) {
  const metadata = order.metadata || {};
  const serviceName = order.serviceName || metadata.serviceName ||
    (order.service_type === 'combo-complete' ? 'Paquete Completo' :
      order.service_type === 'financial-analysis' ? 'Analisis Financiero' :
        order.service_type === 'business-plan' ? 'Business Plan Profesional' :
          'Presentacion Ejecutiva');
  const status = order.status === 'paid' ? 'in_progress' : order.status;

  return {
    id: order.id,
    caseNumber: order.case_number || metadata.caseNumber || `NSD-${String(order.id).substring(0, 8).toUpperCase()}`,
    serviceId: order.service_type,
    serviceName,
    projectName: order.projectName || metadata.projectName || `Proyecto ${order.id.substring(0, 5)}`,
    applicantType: order.applicant_type || metadata.applicantType || "empresa",
    requestedAmount: Number(order.requested_amount || metadata.requestedAmount || metadata.investmentRequired || order.amount || 0),
    fundingPurpose: order.funding_purpose || metadata.fundingPurpose || metadata.useOfFunds || "Preparacion de expediente",
    stage: order.stage || metadata.caseStage || (status === "pending" ? "captura" : status === "completed" ? "cerrado" : "revision_documental"),
    readinessGrade: order.readiness_grade || metadata.readinessGrade || "pendiente",
    riskLevel: order.risk_level || metadata.riskLevel || "pendiente",
    complianceStatus: order.compliance_status || metadata.complianceStatus || "pendiente",
    canShareWithFunders: Boolean(order.can_share_with_funders || metadata.canShareWithFunders),
    status,
    progress: status === 'completed' ? 100 : status === 'in_progress' ? 35 : 0,
    amount: order.amount,
    specialist: {
      id: "spec-auto",
      name: status === "pending" ? "Pendiente Asignacion" : `Mesa ${BRAND.name}`,
      email: "contacto@nsd.com",
      avatar: status === "pending" ? "PA" : "NS",
    },
    createdAt: new Date(order.created_at).toISOString().split('T')[0],
    expectedDelivery: order.expectedDelivery || "Pendiente",
    metadata,
    timeline: [
      { date: new Date(order.created_at).toISOString().split('T')[0], event: "Orden creada", status: "completed" },
      { date: status === "pending" ? "TBD" : "2026-05-25", event: "Especialista asignado", status: status === "pending" ? "pending" : "completed" },
      { date: status === "completed" ? "2026-05-24" : "TBD", event: "Revision documental", status: status === "completed" ? "completed" : status === "in_progress" ? "in_progress" : "pending" },
    ],
    demo: order.id.startsWith("demo-")
  };
}
