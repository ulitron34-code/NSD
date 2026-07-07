import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Sentry debe inicializarse antes de todo lo demás
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
}

// Routes
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import documentsRoutes from './routes/documents.js';
import sharesRoutes from './routes/shares.js';
import auditRoutes from './routes/audit.js';
import scoringRoutes from './routes/scoring.js';
import regulatoryRoutes from './routes/regulatory.js';
import otorganteRoutes from './routes/otorgante.js';
import institutionalRoutes from './routes/institutional.js';
import informationRequestsRoutes from './routes/informationRequests.js';
import documentIntelligenceRoutes from './routes/documentIntelligence.routes.js';
import complianceRoutes from './routes/compliance.js';
import checklistRoutes from './routes/checklist.js';
import apiKeysRoutes from './routes/apiKeys.js';
import screeningRoutes from './routes/screening.js';
import caseManagerRoutes from './routes/caseManager.js';
import transactionRoutes from './routes/transactionOversight.js';
import f6Routes from './routes/f6Regulatory.js';
import whatsappRoutes from './routes/whatsapp.js';
import nsdApplicantRoutes from './routes/nsdApplicant.js';
import requisitosMinimosRoutes from './routes/requisitosMinimos.js';
import readinessChecklistRoutes from './routes/readinessChecklist.js';
import referenceSourcesRoutes from './routes/referenceSources.js';
import messagingRoutes from './routes/messaging.js';
import activitySummaryRoutes from './routes/activitySummary.js';
import { getOfacListStatus } from './services/ofacScreening.js';
import { getGatewayStatus, primeAllLists } from './services/sanctionsGateway.js';
import { primeRegulatoryLists } from './services/regulatoryGateway.js';
import { startComplianceCron } from './services/complianceAlertCron.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173,https://nsd-pi.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!isDev) {
  app.set('trust proxy', 1);
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin(origin, callback) {
    // En desarrollo: permitir cualquier localhost sin importar el puerto
    if (!origin) return callback(null, true);
    if (isDev && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('Origen no permitido por CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
}));
// Stripe webhook necesita raw body; Twilio webhook llega como form-encoded
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use('/api/whatsapp/webhook', express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', ordersRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', documentsRoutes);
app.use('/api', sharesRoutes);
app.use('/api', auditRoutes);
app.use('/api', scoringRoutes);
app.use('/api', regulatoryRoutes);
app.use('/api', otorganteRoutes);
app.use('/api', institutionalRoutes);
app.use('/api', informationRequestsRoutes);
app.use('/api', documentIntelligenceRoutes);
app.use('/api', complianceRoutes);
app.use('/api', checklistRoutes);
app.use('/api', apiKeysRoutes);
app.use('/api', screeningRoutes);
app.use('/api', caseManagerRoutes);
app.use('/api', transactionRoutes);
app.use('/api', f6Routes);
app.use('/api', whatsappRoutes);
app.use('/api', nsdApplicantRoutes);
app.use('/api', requisitosMinimosRoutes);
app.use('/api', readinessChecklistRoutes);
app.use('/api', referenceSourcesRoutes);
app.use('/api', messagingRoutes);
app.use('/api', activitySummaryRoutes);

// Health check
app.get('/health', (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'nsd-backend'
  };

  // Only show detailed config in development
  if (isDev) {
    response.config = {
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.SUPABASE_KEY),
      supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      stripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      stripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      anthropicApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      deepseekApiKey: Boolean(process.env.DEEPSEEK_API_KEY),
      nvidiaApiKey: Boolean(process.env.NVIDIA_API_KEY),
      twilioWhatsapp: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      applicantAgent: Boolean(process.env.ANTHROPIC_API_KEY),
      satApi: Boolean(process.env.SAT_API_URL && process.env.SAT_API_KEY),
      buroApi: Boolean(process.env.BURO_API_URL && process.env.BURO_API_KEY),
      regulatoryProviders: {
        companiesHouse: Boolean(process.env.COMPANIES_HOUSE_API_KEY),
        mexicoRfc: Boolean(process.env.MEXICO_RFC_API_URL && process.env.MEXICO_RFC_API_KEY),
        mexicoUif: Boolean(process.env.MEXICO_UIF_API_URL && process.env.MEXICO_UIF_API_KEY),
        sanctionsGateway: getGatewayStatus(),
        equifax: Boolean(process.env.EQUIFAX_API_URL && process.env.EQUIFAX_API_KEY),
        dubaiEmiratesId: Boolean(process.env.DUBAI_EMIRATES_ID_API_URL && process.env.DUBAI_EMIRATES_ID_API_KEY),
        dubaiTradeLicense: Boolean(process.env.DUBAI_TRADE_LICENSE_API_URL && process.env.DUBAI_TRADE_LICENSE_API_KEY)
      },
      corsOrigins: allowedOrigins.length
    };
  }

  res.json(response);
});

// Error handler
app.use((err, req, res, next) => {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  primeAllLists();
  primeRegulatoryLists();
  startComplianceCron();
});
