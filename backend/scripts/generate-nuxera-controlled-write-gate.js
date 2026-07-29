import { getNuxeraControlledWriteGate } from '../src/services/nuxeraControlledWriteGateService.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const backendReady = process.argv.includes('--backend-ready');
const approvalReady = process.argv.includes('--approval-ready');
const writeGate = getNuxeraControlledWriteGate({
  backendReadiness: backendReady
    ? { ready: true, summary: { total: 3, available: 3, unavailable: 0, readiness: 100 }, signals: [] }
    : undefined,
  approvalPackage: approvalReady
    ? { id: 'nuxera-controlled-approval-package', readyForReleaseDecision: true, blockers: [] }
    : undefined,
  requestedScope: readArg('scope'),
  requestedEnvironment: readArg('environment'),
  changeTicket: readArg('change-ticket')
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(writeGate, null, 2));
} else {
  console.log(`NUXERA controlled write gate: ${writeGate.status}`);
  console.log(`Ready for controlled write change: ${writeGate.readyForControlledWriteChange ? 'yes' : 'no'}`);
  console.log(`Blockers: ${writeGate.blockers.length}`);
  for (const blocker of writeGate.blockers) console.log(`- ${blocker}`);
  console.log(writeGate.nextDecision);
}

if (!writeGate.readyForControlledWriteChange) {
  process.exitCode = 1;
}
