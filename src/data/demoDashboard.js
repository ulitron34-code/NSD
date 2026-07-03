import { COLORS } from "../utils/constants";

// ============================================
// NEXUS PLATFORM - REALISTIC DEMO DATA
// Data that impresses investors
// ============================================

// 6 months of compliance trends - showing growth
export const complianceTrend = [
  { month: "Ene", completos: 58, pendientes: 21 },
  { month: "Feb", completos: 64, pendientes: 18 },
  { month: "Mar", completos: 71, pendientes: 16 },
  { month: "Abr", completos: 76, pendientes: 14 },
  { month: "May", completos: 82, pendientes: 11 },
  { month: "Jun", completos: 87, pendientes: 8 },
];

// Case status breakdown
export const caseStatus = [
  { name: "Aprobados", value: 32, color: COLORS.green },
  { name: "En revisión", value: 14, color: COLORS.amber },
  { name: "Observados", value: 7, color: "#C62828" },
  { name: "Por vencer", value: 10, color: COLORS.navyLight },
];

// Risk distribution
export const riskData = [
  { range: "Bajo", count: 28 },
  { range: "Medio", count: 18 },
  { range: "Alto", count: 9 },
  { range: "Crítico", count: 3 },
];

// Main KPIs for dashboard
export const dashboardKpis = [
  { 
    title: "Cumplimiento general", 
    value: "87%", 
    helper: "+5% vs mes anterior", 
    color: COLORS.green,
    trend: "+5%",
    trendUp: true
  },
  { 
    title: "Expedientes activos", 
    value: "63", 
    helper: "14 en revisión", 
    color: COLORS.navy,
    trend: "+12",
    trendUp: true
  },
  { 
    title: "Docs por vencer", 
    value: "10", 
    helper: "3 críticos esta semana", 
    color: COLORS.amber,
    trend: "-3",
    trendUp: true
  },
  { 
    title: "Riesgos altos", 
    value: "12", 
    helper: "Requieren remediación", 
    color: "#C62828",
    trend: "-4",
    trendUp: true
  },
];

// Funding pipeline stats
export const fundingStats = {
  total: 2450000,
  currency: "USD",
  distribution: [
    { name: "Capital de trabajo", value: 1200000, percent: 49 },
    { name: "Expansión", value: 750000, percent: 31 },
    { name: "Equipamiento", value: 350000, percent: 14 },
    { name: "Refinanciamiento", value: 150000, percent: 6 },
  ]
};

// Recent activity feed
export const recentActivity = [
  {
    id: 1,
    type: "success",
    icon: "✓",
    title: "KYC aprobado",
    description: "TechSolutions Monterrey S.A. verificado",
    time: "Hace 5 minutos",
    user: "María González"
  },
  {
    id: 2,
    type: "payment",
    icon: "💳",
    title: "Pago recibido",
    description: "$8,500 USD - Paquete Growth",
    time: "Hace 23 minutos",
    user: "Finanzas Gpo"
  },
  {
    id: 3,
    type: "document",
    icon: "📄",
    title: "Documento subido",
    description: "Estados financieros Q1 2024",
    time: "Hace 1 hora",
    user: "Carlos Mendoza"
  },
  {
    id: 4,
    type: "alert",
    icon: "⚠️",
    title: "Vencimiento próximo",
    description: "Certificado SAT expira en 7 días",
    time: "Hace 2 horas",
    user: "Sistema"
  },
  {
    id: 5,
    type: "success",
    icon: "✓",
    title: "Score actualizado",
    description: "Risk score: 78/100 - Grade B+",
    time: "Hace 3 horas",
    user: "AI Agent"
  },
];

// Otorgante (Funder) pipeline
export const otorgantePipeline = [
  {
    id: "OP-2024-001",
    empresa: "Constructora Delta S.A.",
    tipo: "Capital de trabajo",
    monto: 2500000,
    pais: "México",
    estado: "analisis",
    progreso: 65,
    fecha: "2024-06-10",
    score: 82
  },
  {
    id: "OP-2024-002",
    empresa: "Distribuidora Norte S.A.",
    tipo: "Expansión",
    monto: 1800000,
    pais: "México",
    estado: "revision",
    progreso: 40,
    fecha: "2024-06-08",
    score: 75
  },
  {
    id: "OP-2024-003",
    empresa: "Tech Innovators LLC",
    tipo: "Equipamiento",
    monto: 950000,
    pais: "USA",
    estado: "kyc",
    progreso: 85,
    fecha: "2024-06-05",
    score: 91
  },
  {
    id: "OP-2024-004",
    empresa: "Logística Regional S.A.",
    tipo: "Refinanciamiento",
    monto: 1200000,
    pais: "Colombia",
    estado: "documentos",
    progreso: 30,
    fecha: "2024-06-01",
    score: 68
  },
  {
    id: "OP-2024-005",
    empresa: "Manufacturas del Norte",
    tipo: "Capital de trabajo",
    monto: 3500000,
    pais: "México",
    estado: "pendiente",
    progreso: 15,
    fecha: "2024-05-28",
    score: null
  },
];

// Metrics for analytics
export const analyticsMetrics = {
  kycCompletionRate: 94,
  avgProcessingTime: "3.2 días",
  complianceScore: 87,
  activeFunds: 12,
  totalVolume: "$2.4M USD",
  monthlyGrowth: 23,
};

// Company types for demo
export const companyTypes = [
  "SA de CV",
  "S de RL de CV",
  "SAPI de CV",
  "SAS",
  "LLC",
  "Corporation",
  "GmbH",
  "Ltd"
];

// Countries supported
export const supportedCountries = [
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AE", name: "Emiratos Árabes", flag: "🇦🇪" },
];

// User profiles for demo
export const demoUsers = {
  solicitante: {
    id: "user-001",
    email: "maria.gonzalez@techsolutions.mx",
    name: "María González",
    company: "TechSolutions Monterrey S.A.",
    role: "solicitante",
    avatar: "MG",
    plan: "Growth",
    documents: 24,
    complianceScore: 87,
    lastLogin: "Hace 5 minutos"
  },
  otorgante: {
    id: "user-002",
    email: "juan.perez@capitalfVentures.com",
    name: "Juan Pérez",
    company: "Capital Ventures",
    role: "otorgante",
    avatar: "JP",
    funds: 12,
    volumeManaged: "$45M USD",
    lastLogin: "Hace 1 hora"
  },
  admin: {
    id: "user-003",
    email: "admin@nsd.com",
    name: "Admin NEXUS",
    company: "NEXUS Platform",
    role: "administrador",
    avatar: "AN",
    usersManaged: 156,
    lastLogin: "Ahora"
  }
};
