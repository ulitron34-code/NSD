// AVISO: Este servicio es solo para acceso demo local.
// La autenticación real usa auth.service.js + backend Express + Supabase.
// (Las funciones de login/registro/password de este módulo se eliminaron:
// no se usaban en el flujo real y su comparación de contraseña tenía un
// bypass — siempre aceptaba cualquier password porque comparaba contra el
// literal 'DEMO_ONLY' que se le asignaba a todos los usuarios.)

import { BRAND } from "../config/brand";

export const ROLES = {
  SOLICITANTE: 'solicitante',
  OTORGANTE: 'otorgante',
  ADMIN: 'nsd_admin'
};

// Lista de cuentas demo para mostrar en LoginPage (login real va por auth.service.js)
export function createDemoUsers() {
  return [
    {
      id: 'user-solicitante-001',
      email: 'empresa@ejemplo.com',
      name: 'Empresa Solicitante',
      role: ROLES.SOLICITANTE,
      company: 'TechStart México',
    },
    {
      id: 'user-otorgante-001',
      email: 'fondo@ejemplo.com',
      name: 'Fondo de Inversión',
      role: ROLES.OTORGANTE,
      company: 'Nexus Capital',
    },
    {
      id: 'user-admin-001',
      email: 'admin@nsd.mx',
      name: `Admin ${BRAND.name}`,
      role: ROLES.ADMIN,
      company: BRAND.name,
    }
  ];
}
