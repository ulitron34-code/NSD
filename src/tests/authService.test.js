import { describe, it, expect } from 'vitest';
import { ROLES, createDemoUsers } from '../services/authService';

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

    it('should not include password fields (this module no longer manages credentials)', () => {
      const users = createDemoUsers();
      users.forEach(user => {
        expect(user.password).toBeUndefined();
      });
    });
  });
});
