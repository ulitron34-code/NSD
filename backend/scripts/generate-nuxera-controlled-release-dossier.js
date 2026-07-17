import { getNuxeraControlledReleaseDossier } from '../src/services/nuxeraControlledReleaseDossierService.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const changeRequestReady = process.argv.includes('--change-request-ready');
const releaseDossier = getNuxeraControlledReleaseDossier({
  changeRequest: changeRequestReady
    ? {
        id: 'nuxera-controlled-change-request',
        status: 'ready-for-separate-change-review',
        readyForChangeReview: true,
        changeMetadata: {
          changeTicket: readArg('change-ticket') || 'CHG-NUXERA-TODO',
          requestedEnvironment: readArg('environment') || 'controlled-non-production'
        },
        blockers: []
      }
    : undefined,
  changeTicket: readArg('change-ticket'),
  requestedEnvironment: readArg('environment'),
  dossierOwner: readArg('dossier-owner'),
  dossierDate: readArg('dossier-date'),
  finalReviewer: readArg('final-reviewer')
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(releaseDossier, null, 2));
} else if (process.argv.includes('--markdown')) {
  console.log(releaseDossier.markdown);
} else {
  console.log(`NUXERA controlled release dossier: ${releaseDossier.status}`);
  console.log(`Ready for release review: ${releaseDossier.readyForReleaseReview ? 'yes' : 'no'}`);
  console.log(`Blockers: ${releaseDossier.blockers.length}`);
  for (const blocker of releaseDossier.blockers) console.log(`- ${blocker}`);
  console.log(releaseDossier.nextDecision);
}

if (!releaseDossier.readyForReleaseReview) {
  process.exitCode = 1;
}
