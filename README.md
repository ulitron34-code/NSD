# NSD Platform - Documentación Técnica

> Sistema integral de gestión documental para financiamiento institucional (MEXICO & LATAM)

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/ulitron34-code/NSD.git
cd NSD

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Tests
npm run test:run

# Build producción
npm run build
```

## 🌐 Deployments

### Frontend (Netlify/Vercel)
```bash
# Variables de entorno requeridas
VITE_API_URL=https://tu-backend.onrender.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
VITE_DEMO_MODE=false
```

### Backend (Render)
```bash
# Variables de entorno requeridas
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CORS_ORIGIN=https://tu-frontend.netlify.app
```

### Webhook de Stripe
En el dashboard de Stripe, configurar:
- URL: `https://tu-backend.onrender.com/api/webhook`
- Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`

## 📁 Estructura del Proyecto

```
NSD/
├── frontend/                    # React app (este repo)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Login, Signup
│   │   │   ├── common/          # Skeleton, Breadcrumbs
│   │   │   ├── Dashboard/        # Dashboard principal
│   │   │   │   ├── Solicitante/ # Flujo solicitantes
│   │   │   │   └── Otorgante/   # Flujo otorgantes
│   │   │   ├── Landing/          # Páginas landing
│   │   │   └── Layout/           # Header, Footer
│   │   ├── context/              # ToastContext, ThemeContext
│   │   ├── pages/                # Páginas principales
│   │   ├── services/             # api.js, pricingService.js
│   │   └── utils/               # logger, i18n, crypto
│   └── public/
│
├── backend/                      # Node/Express API
│   ├── src/
│   │   ├── config/              # supabase.js
│   │   ├── middleware/          # auth.js
│   │   ├── routes/              # payments.js, orders.js, etc.
│   │   ├── services/            # aiEngine.js
│   │   └── server.js            # Entry point
│   └── render.yaml              # Configuración Render
│
└── scripts/                     # Scripts de deployment
```

## 🏗️ Arquitectura

### Flujos Principales

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Solicitante │────▶│    NSD       │────▶│   Otorgante     │
│  (Empresa)  │     │   Platform   │     │    (Fondo)      │
└─────────────┘     └──────────────┘     └─────────────────┘
      │                    │                     │
      │ Subir proyecto     │ Scoring & triage    │ Pipeline review
      │ Documentos         │ AI Agents           │ Forensic analysis
      │ Data room          │ Compliance          │ Decision room
```

### Roles de Usuario

| Rol | Descripción | Funcionalidades principales |
|-----|-------------|----------------------------|
| `solicitante` | Empresa buscando financiamiento | Subir proyecto, documentos, tracking |
| `otorgante` | Fondo de inversión | Pipeline, análisis forense, scoring |
| `nsd_admin` | Administrador NSD | Control center, métricas globales |

## 🔐 Seguridad

### Contraseñas
- Hash con **bcrypt** (12 salt rounds)
- No se almacenan contraseñas en texto plano

### Tokens de Sesión
- Generación con `crypto.randomUUID()`
- Almacenamiento en localStorage (sesión del navegador)

### Logging
- Sistema centralizado en `src/utils/logger.js`
- **Desactivado automáticamente en producción**

## 🤖 AI Agents

El sistema integra agentes de IA para análisis automático:

### Endpoints de API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ai-agents/documents/:orderId/triage` | Triaje documental |
| POST | `/api/ai-agents/forensic/:orderId/analyze` | Análisis forense KYB/KYC |
| POST | `/api/ai-agents/risk/:orderId/memo` | Generación de memo de riesgo |
| GET | `/api/ai-agents/orchestration/:orderId` | Estado de orquestación |

### Configuración de Backend

```env
# .env
VITE_API_URL=https://tu-backend.com/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_DEMO_MODE=true
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test:run

# Con coverage
npm run test:coverage

# Modo watch
npm test
```

### Archivos de Test

- `src/tests/authService.test.js` - Tests de autenticación
- `src/tests/cryptoUtils.test.js` - Tests de utilidades criptográficas
- `src/tests/logger.test.js` - Tests del sistema de logging

## 📦 Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| react | ^18.2.0 | Framework UI |
| react-router-dom | ^7.17.0 | Routing |
| axios | ^1.16.1 | HTTP client |
| bcryptjs | ^3.0.3 | Hashing de contraseñas |
| i18next | ^23.7.16 | Internacionalización |
| recharts | ^3.8.1 | Gráficos |
| vitest | ^4.1.8 | Testing |

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend | `https://api.example.com/api` |
| `VITE_STRIPE_PUBLIC_KEY` | Clave pública de Stripe | `pk_test_...` |
| `VITE_DEMO_MODE` | Modo demo (desarrollo) | `true` |

## 📱 Screenshots de Componentes

### Dashboard Solicitante
- `SubirProyectoTab` - Carga y análisis de proyectos con AI Agents
- `FundingReadinessTab` - Checklist de preparación institucional
- `MatchesTab` - Otorgantes sugeridos

### Dashboard Otorgante
- `PipelineTab` - Pipeline de oportunidades con gates
- `ForensicAnalysisTab` - Análisis forense de KYB/KYC
- `AnalyticsTab` - Métricas y analytics

### Admin
- `ControlCenter` - Panel de control global
- `CumplimientoTab` - Gestión de compliance

## 🚢 Despliegue

### Build para Producción

```bash
npm run build
# Genera archivos en /dist
```

### Netlify (Recomendado)

El proyecto incluye configuración para Netlify en `netlify.toml`.

## 📝 Convenciones de Código

### Nomenclatura
- Componentes: PascalCase (`MiPerfilTab.jsx`)
- Servicios/Utils: camelCase (`authService.js`, `cryptoUtils.js`)
- Hooks: camelCase con prefijo `use` (`useAuth.js`, `useNotification.js`)

### Imports
```javascript
// Utilidades
import { generateSecureToken } from '../utils/cryptoUtils';
import { error, debug } from '../utils/logger';

// Servicios
import { ordersAPI, aiAgentsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
```

## 🐛 Debugging

### Logs en Desarrollo
Los logs aparecen en consola en modo desarrollo:
```javascript
debug('API', 'Request:', payload);
error('SVC', 'Error:', error);
```

### Tests con Coverage
```bash
npm run test:coverage
# Genera reporte HTML en coverage/
```

## 📄 Licencia

Proprietario - ulitron34-code

---

**Versión:** 0.0.0  
**Última actualización:** 2026-06-12