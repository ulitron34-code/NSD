import { describe, it, expect } from 'vitest';
import {
  ROLES,
  createDemoUsers,
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  isAuthenticated,
  getUserRole,
  changePassword
} from '../services/authService';

describe('authService', () => {
  describe('ROLES', () => {
    it('should have all required roles defined', () => {
      expect(ROLES.SOLICITANTE).toBe('solicitante');
      expect(ROLES.OTORGANTE).toBe('otorgante');
      expect(ROLES.ADMIN).toBe('nsd_admin');
    });
  });

  describe('createDemoUsers', () => {
    it('should return array of 3 demo users', () => {
      const users = createDemoUsers();
      expect(users).toHaveLength(3);
    });

    it('should have users with all required roles', () => {
      const users = createDemoUsers();
      const roles = users.map(u => u.role);
      expect(roles).toContain(ROLES.SOLICITANTE);
      expect(roles).toContain(ROLES.OTORGANTE);
      expect(roles).toContain(ROLES.ADMIN);
    });

    it('should have pre-hashed passwords (bcrypt format)', () => {
      const users = createDemoUsers();
      users.forEach(user => {
        expect(user.password).toMatch(/^\$2[aby]?\$\d{1,2}\$/);
      });
    });
  });

  describe('registerUser', () => {
    it('should register a new user successfully', () => {
      const user = registerUser('test@example.com', 'Password123!', 'Test User', ROLES.SOLICITANTE, 'Test Co');
      
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe(ROLES.SOLICITANTE);
      expect(user.company).toBe('Test Co');
      expect(user.id).toBeDefined();
    });

    it('should store user in localStorage', () => {
      registerUser('test2@example.com', 'Password123!', 'Test', ROLES.SOLICITANTE, 'Co');
      
      const stored = localStorage.getItem('nsd_users');
      expect(stored).toBeTruthy();
      const users = JSON.parse(stored);
      expect(users.some(u => u.email === 'test2@example.com')).toBe(true);
    });

    it('should throw error for duplicate email', () => {
      registerUser('dup@example.com', 'Password123!', 'User1', ROLES.SOLICITANTE, 'Co');
      
      expect(() => {
        registerUser('dup@example.com', 'Password123!', 'User2', ROLES.SOLICITANTE, 'Co2');
      }).toThrow('Email ya registrado');
    });
  });

  describe('loginUser', () => {
    it('should login with correct credentials', () => {
      registerUser('login@example.com', 'MyPassword123!', 'Login User', ROLES.SOLICITANTE, 'Co');
      
      const user = loginUser('login@example.com', 'MyPassword123!');
      
      expect(user.email).toBe('login@example.com');
      expect(getCurrentUser()).toBeTruthy();
    });

    it('should create session token on login', () => {
      registerUser('token@example.com', 'Password123!', 'Token User', ROLES.SOLICITANTE, 'Co');
      loginUser('token@example.com', 'Password123!');
      
      const token = localStorage.getItem('nsd_session_token');
      expect(token).toBeTruthy();
      expect(token).toMatch(/^tok_/);
    });

    it('should throw error for non-existent user', () => {
      expect(() => {
        loginUser('nonexistent@example.com', 'Password123!');
      }).toThrow('Usuario no encontrado');
    });

    it('should throw error for wrong password', () => {
      registerUser('wrong@example.com', 'CorrectPassword!', 'User', ROLES.SOLICITANTE, 'Co');
      
      expect(() => {
        loginUser('wrong@example.com', 'WrongPassword!');
      }).toThrow('Contraseña incorrecta');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('should return current user after login', () => {
      registerUser('current@example.com', 'Password123!', 'Current User', ROLES.OTORGANTE, 'Co');
      loginUser('current@example.com', 'Password123!');
      
      const user = getCurrentUser();
      expect(user).toBeTruthy();
      expect(user.email).toBe('current@example.com');
    });
  });

  describe('logoutUser', () => {
    it('should clear session on logout', () => {
      registerUser('logout@example.com', 'Password123!', 'Logout User', ROLES.SOLICITANTE, 'Co');
      loginUser('logout@example.com', 'Password123!');
      
      logoutUser();
      
      expect(getCurrentUser()).toBeNull();
      expect(localStorage.getItem('nsd_session_token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not logged in', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when logged in', () => {
      registerUser('auth@example.com', 'Password123!', 'Auth User', ROLES.SOLICITANTE, 'Co');
      loginUser('auth@example.com', 'Password123!');
      
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('getUserRole', () => {
    it('should return correct role after login', () => {
      registerUser('role@example.com', 'Password123!', 'Role User', ROLES.ADMIN, 'Co');
      loginUser('role@example.com', 'Password123!');
      
      expect(getUserRole()).toBe(ROLES.ADMIN);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', () => {
      registerUser('change@example.com', 'OldPassword123!', 'Change User', ROLES.SOLICITANTE, 'Co');
      loginUser('change@example.com', 'OldPassword123!');
      
      const result = changePassword('OldPassword123!', 'NewPassword456!');
      
      expect(result).toBe(true);
      // Verify new password works
      expect(() => loginUser('change@example.com', 'OldPassword123!')).toThrow('Contraseña incorrecta');
      expect(() => loginUser('change@example.com', 'NewPassword456!')).not.toThrow();
    });

    it('should throw error for wrong current password', () => {
      registerUser('wrongcur@example.com', 'CorrectPassword!', 'User', ROLES.SOLICITANTE, 'Co');
      loginUser('wrongcur@example.com', 'CorrectPassword!');
      
      expect(() => {
        changePassword('WrongPassword!', 'NewPassword123!');
      }).toThrow('Contraseña actual incorrecta');
    });
  });
});