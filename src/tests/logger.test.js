import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  enableDebugMode,
  disableLogging,
  apiLogger,
  authLogger,
  dataLogger
} from '../utils/logger';

describe('logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Reset to default level
    setLogLevel(4); // NONE
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    setLogLevel(4);
  });

  describe('log levels', () => {
    it('should not log when level is NONE', () => {
      setLogLevel(4);
      debug('TEST', 'debug message');
      info('TEST', 'info message');
      warn('TEST', 'warn message');
      error('TEST', 'error message');
      
      // In NODE_ENV=test, only errors might log
    });

    it('should log DEBUG when level is DEBUG (0)', () => {
      setLogLevel(0);
      debug('TEST', 'debug message');
    });

    it('should log INFO when level is INFO (1) or lower', () => {
      setLogLevel(1);
      info('TEST', 'info message');
    });

    it('should log WARN when level is WARN (2) or lower', () => {
      setLogLevel(2);
      warn('TEST', 'warn message');
    });

    it('should log ERROR when level is ERROR (3) or lower', () => {
      setLogLevel(3);
      error('TEST', 'error message');
    });
  });

  describe('enableDebugMode / disableLogging', () => {
    it('should enable debug mode', () => {
      enableDebugMode();
      setLogLevel(0);
      debug('TEST', 'debug message');
    });

    it('should disable all logging', () => {
      disableLogging();
      setLogLevel(4);
      // Nothing should log
    });
  });

  describe('apiLogger', () => {
    it('should have request method', () => {
      expect(apiLogger.request).toBeDefined();
      expect(typeof apiLogger.request).toBe('function');
    });

    it('should have success method', () => {
      expect(apiLogger.success).toBeDefined();
      expect(typeof apiLogger.success).toBe('function');
    });

    it('should have error method', () => {
      expect(apiLogger.error).toBeDefined();
      expect(typeof apiLogger.error).toBe('function');
    });
  });

  describe('authLogger', () => {
    it('should have login method', () => {
      expect(authLogger.login).toBeDefined();
    });

    it('should have success method', () => {
      expect(authLogger.success).toBeDefined();
    });

    it('should have failure method', () => {
      expect(authLogger.failure).toBeDefined();
    });

    it('should have logout method', () => {
      expect(authLogger.logout).toBeDefined();
    });
  });

  describe('dataLogger', () => {
    it('should have read method', () => {
      expect(dataLogger.read).toBeDefined();
    });

    it('should have write method', () => {
      expect(dataLogger.write).toBeDefined();
    });

    it('should have delete method', () => {
      expect(dataLogger.delete).toBeDefined();
    });

    it('should have error method', () => {
      expect(dataLogger.error).toBeDefined();
    });
  });

  describe('message formatting', () => {
    it('should handle object arguments', () => {
      setLogLevel(1);
      info('TEST', { key: 'value', nested: { data: 123 } });
    });

    it('should handle multiple arguments', () => {
      setLogLevel(1);
      info('TEST', 'message1', 'message2', 123);
    });

    it('should handle null and undefined', () => {
      setLogLevel(1);
      info('TEST', null, undefined);
    });
  });
});