import { error, debug, info, warn } from '../utils/logger';
// ============================================
// SERVICIO DE AUTENTICACIÓN LOCAL
// Login/Register con persistencia en localStorage
// Versión mejorada con hashing seguro y tokens criptográficos
// ============================================

import bcrypt from 'bcryptjs';
import { generateSecureToken } from '../utils/cryptoUtils';

export const ROLES = {
  SOLICITANTE: 'solicitante',
  OTORGANTE: 'otorgante',
  ADMIN: 'nsd_admin'
};

// Salt rounds para bcrypt (12 es un buen balance entre seguridad y rendimiento)
const BCRYPT_SALT_ROUNDS = 12;

// Crear usuario demo con contraseñas seguras pre-hasheadas
// NOTA: Las contraseñas demo son solo para desarrollo local
export function createDemoUsers() {
  // Contraseñas pre-hasheadas con bcrypt (todas son "Demo1234!" para fácil testing)
  // En producción esto se haría dinámicamente con hashPassword()
  const demoPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FaQgPGLL.F/NdC'; // Demo1234!
  
  return [
    {
      id: 'user-solicitante-001',
      email: 'empresa@ejemplo.com',
      password: demoPasswordHash,
      name: 'Empresa Solicitante',
      role: ROLES.SOLICITANTE,
      company: 'TechStart México',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-otorgante-001',
      email: 'fondo@ejemplo.com',
      password: demoPasswordHash,
      name: 'Fondo de Inversión',
      role: ROLES.OTORGANTE,
      company: 'Nexus Capital',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-admin-001',
      email: 'admin@nsd.mx',
      password: demoPasswordHash,
      name: 'Admin NSD',
      role: ROLES.ADMIN,
      company: 'NSD',
      createdAt: new Date().toISOString()
    }
  ];
}

// Obtener todos los usuarios
function getAllUsers() {
  const stored = localStorage.getItem('nsd_users');
  if (!stored) {
    const demoUsers = createDemoUsers();
    localStorage.setItem('nsd_users', JSON.stringify(demoUsers));
    return demoUsers;
  }
  return JSON.parse(stored);
}

// Registrar usuario nuevo
export function registerUser(email, password, name, role, company) {
  const users = getAllUsers();

  // Verificar si ya existe
  if (users.some(u => u.email === email)) {
    throw new Error('Email ya registrado');
  }

  const newUser = {
    id: `user-${role}-${Date.now()}`,
    email,
    password: bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS), // Hash seguro con bcrypt
    name,
    role,
    company,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('nsd_users', JSON.stringify(users));

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    company: newUser.company
  };
}

// Login usuario (versión async para bcrypt)
export async function loginUserAsync(email, password) {
  const users = getAllUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar contraseña con bcrypt
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Contraseña incorrecta');
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company
  };

  // Guardar sesión actual con token seguro
  localStorage.setItem('nsd_current_user', JSON.stringify(sessionUser));
  localStorage.setItem('nsd_session_token', generateSecureToken());

  return sessionUser;
}

// Login usuario (versión sync para compatibilidad - usa bcrypt compare sync)
export function loginUser(email, password) {
  const users = getAllUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar contraseña con bcrypt (sync para compatibilidad)
  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    throw new Error('Contraseña incorrecta');
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company
  };

  // Guardar sesión actual con token seguro
  localStorage.setItem('nsd_current_user', JSON.stringify(sessionUser));
  localStorage.setItem('nsd_session_token', generateSecureToken());

  return sessionUser;
}

// Obtener usuario actual
export function getCurrentUser() {
  const stored = localStorage.getItem('nsd_current_user');
  return stored ? JSON.parse(stored) : null;
}

// Logout
export function logoutUser() {
  localStorage.removeItem('nsd_current_user');
  localStorage.removeItem('nsd_session_token');
}

// Verificar si está autenticado
export function isAuthenticated() {
  return getCurrentUser() !== null && localStorage.getItem('nsd_session_token') !== null;
}

// Obtener rol del usuario
export function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

// Verificar si es solicitante
export function isSolicitante() {
  return getUserRole() === ROLES.SOLICITANTE;
}

// Verificar si es otorgante
export function isOtorgante() {
  return getUserRole() === ROLES.OTORGANTE;
}

// Verificar si es admin
export function isAdmin() {
  return getUserRole() === ROLES.ADMIN;
}

// Hash simple (en prod: bcrypt)
function hashPassword(password) {
  return Buffer.from(password).toString('base64');
}

// Generar token
function generateToken() {
  return `token-${Date.now()}-${Math.random()}`;
}

// Cambiar contraseña (actualizado con bcrypt)
export function changePassword(currentPassword, newPassword) {
  const user = getCurrentUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === user.id);

  if (userIndex === -1) throw new Error('Usuario no encontrado');

  // Verificar contraseña actual con bcrypt
  if (!bcrypt.compareSync(currentPassword, users[userIndex].password)) {
    throw new Error('Contraseña actual incorrecta');
  }

  // Hashear nueva contraseña con bcrypt
  users[userIndex].password = bcrypt.hashSync(newPassword, BCRYPT_SALT_ROUNDS);
  localStorage.setItem('nsd_users', JSON.stringify(users));

  return true;
}

// Obtener lista de usuarios (para admin)
export function getAllUsersInfo() {
  return getAllUsers().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    company: u.company,
    createdAt: u.createdAt
  }));
}
