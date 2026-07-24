import { getNuxeraControlledEvidenceScaffold } from '../src/services/nuxeraControlledEvidenceScaffoldService.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const scaffold = getNuxeraControlledEvidenceScaffold({
  environment: readArg('environment'),
  repoCommit: readArg('commit'),
  operator: readArg('operator'),
  reviewer: readArg('reviewer'),
  priorKnownGoodCommit: readArg('prior-known-good'),
  rollbackOwner: readArg('rollback-owner')
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(scaffold, null, 2));
} else {
  console.log(scaffold.markdown);
}
