import { describe, expect, it } from 'vitest';
import { getNuxeraControlledWriteGate } from './nuxeraControlledWriteGateService.js';

const READY_BACKEND = Object.freeze({
  ready: true,
  status: 'backend-readiness-visible',
  summary: { total: 3, available: 3, unavailable: 0, readiness: 100 },
  signals: []
});

const READY_APPROVAL = Object.freeze({
  id: 'nuxera-controlled-approval-package',
  readyForReleaseDecision: true,
  blockers: []
});

describe('nuxeraControlledWriteGateService', () => {
  it('blocks controlled write gate when backend readiness is incomplete', () => {
    const gate = getNuxeraControlledWriteGate({
      backendReadiness: {
        ready: false,
        summary: { total: 3, available: 2, unavailable: 1, readiness: 67 },
        signals: [{ id: 'admin-controls', table: 'nuxera_admin_controls', ready: false }]
      },
      approvalPackage: READY_APPROVAL,
      requestedEnvironment: 'controlled-non-production',
      changeTicket: 'CHG-1'
    });

    expect(gate.status).toBe('blocked-by-write-gates');
    expect(gate.readyForControlledWriteChange).toBe(false);
    expect(gate.summary).toMatchObject({ backendReady: false, approvalReady: true, backendReadiness: 67 });
    expect(gate.blockers).toEqual(
      expect.arrayContaining(['Backend readiness unavailable: nuxera_admin_controls.'])
    );
  });

  it('blocks controlled write gate when approval package is not ready', () => {
    const gate = getNuxeraControlledWriteGate({
      backendReadiness: READY_BACKEND,
      approvalPackage: {
        id: 'nuxera-controlled-approval-package',
        readyForReleaseDecision: false,
        blockers: ['Missing approval metadata: Evidence Hash.']
      },
      requestedEnvironment: 'controlled-non-production',
      changeTicket: 'CHG-1'
    });

    expect(gate.status).toBe('blocked-by-write-gates');
    expect(gate.summary.approvalReady).toBe(false);
    expect(gate.blockers).toEqual(
      expect.arrayContaining(['Approval package is not ready for human release decision.'])
    );
  });

  it('marks gate ready only for a separate controlled change request', () => {
    const gate = getNuxeraControlledWriteGate({
      backendReadiness: READY_BACKEND,
      approvalPackage: READY_APPROVAL,
      requestedEnvironment: 'controlled-non-production',
      requestedScope: 'applicant-checklist-controlled-write',
      changeTicket: 'CHG-NUXERA-001'
    });

    expect(gate).toMatchObject({
      id: 'nuxera-controlled-write-gate',
      status: 'ready-for-controlled-write-change',
      readyForControlledWriteChange: true,
      summary: {
        backendReady: true,
        backendReadiness: 100,
        approvalReady: true,
        blockers: 0
      }
    });
    expect(gate.nextDecision).toContain('do not enable writes automatically');
    expect(gate.guardrails.join(' ')).toContain('not automatic production approval');
  });
});
