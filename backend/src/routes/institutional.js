import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const catalogs = {
  caseStages: [
    { value: 'captura', label: 'Captura', description: 'El solicitante integra informacion base del proyecto.' },
    { value: 'revision_documental', label: 'Revision documental', description: 'NSD revisa documentos, vigencias y consistencia.' },
    { value: 'scoring', label: 'Scoring', description: 'Se calcula preparacion institucional y alertas.' },
    { value: 'data_room', label: 'Data room', description: 'Expediente ordenado para revision controlada.' },
    { value: 'presentado_otorgantes', label: 'Presentado a otorgantes', description: 'Disponible para entidades autorizadas.' },
    { value: 'cerrado', label: 'Cerrado', description: 'Expediente concluido o archivado.' }
  ],
  readinessGrades: [
    { value: 'A', label: 'Robusto', color: 'green' },
    { value: 'B', label: 'Viable con observaciones menores', color: 'blue' },
    { value: 'C', label: 'Incompleto pero corregible', color: 'amber' },
    { value: 'D', label: 'Riesgo alto o faltantes criticos', color: 'red' },
    { value: 'E', label: 'No presentable', color: 'dark-red' }
  ],
  complianceStatuses: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_revision', label: 'En revision' },
    { value: 'observado', label: 'Observado' },
    { value: 'aprobado_para_presentacion', label: 'Aprobado para presentacion' },
    { value: 'rechazado_por_cumplimiento', label: 'Rechazado por cumplimiento' }
  ],
  documentTypes: [
    { value: 'identidad_kyc', label: 'Identidad y KYC' },
    { value: 'corporativo_legal', label: 'Corporativo legal' },
    { value: 'financiero', label: 'Financiero' },
    { value: 'fiscal', label: 'Fiscal' },
    { value: 'proyecto', label: 'Proyecto' },
    { value: 'garantias', label: 'Garantias' },
    { value: 'otro', label: 'Otro' }
  ],
  documentStatuses: [
    { value: 'uploaded', label: 'Cargado' },
    { value: 'in_review', label: 'En revision' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'observed', label: 'Observado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'expired', label: 'Vencido' },
    { value: 'waived', label: 'Dispensado' }
  ]
};

router.get('/institutional/catalogs', authMiddleware, (req, res) => {
  res.json(catalogs);
});

export default router;
