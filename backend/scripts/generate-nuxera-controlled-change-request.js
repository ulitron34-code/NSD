import { getNuxeraControlledChangeRequest } from '../src/services/nuxeraControlledChangeRequestService.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const writeGateReady = process.argv.includes('--write-gate-ready');
const changeRequest = getNuxeraControlledChangeRequest({
  writeGate: writeGateReady
    ? {
        id: 'nuxera-controlled-write-gate',
        readyForControlledWriteChange: true,
        requestedScope: readArg('scope') || 'applicant-checklist-controlled-write',
        requestedEnvironment: readArg('environment') || 'controlled-non-production',
        changeTicket: readArg('change-ticket') || 'CHG-NUXERA-TODO',
        blockers: []
      }
    : undefined,
  requestedScope: readArg('scope'),
  requestedEnvironment: readArg('environment'),
  changeTicket: readArg('change-ticket'),
  deploymentWindow: readArg('deployment-window'),
  rollbackOwner: readArg('rollback-owner'),
  releaseReviewer: readArg('release-reviewer')
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(changeRequest, null, 2));
} else if (process.argv.includes('--markdown')) {
  console.log(changeRequest.markdown);
} else {
  console.log(`NUXERA controlled change request: ${changeRequest.status}`);
  console.log(`Ready for change review: ${changeRequest.readyForChangeReview ? 'yes' : 'no'}`);
  console.log(`Blockers: ${changeRequest.blockers.length}`);
  for (const blocker of changeRequest.blockers) console.log(`- ${blocker}`);
  console.log(changeRequest.nextDecision);
}

if (!changeRequest.readyForChangeReview) {
  process.exitCode = 1;
}
