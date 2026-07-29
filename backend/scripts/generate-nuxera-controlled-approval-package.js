import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getNuxeraControlledApprovalPackage } from '../src/services/nuxeraControlledApprovalPackageService.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const file = readArg('file');
let markdown = readArg('markdown') || '';

if (file) {
  const filePath = resolve(process.cwd(), file);
  if (!existsSync(filePath)) {
    console.error(`ERROR - evidence file not found: ${file}`);
    process.exit(1);
  }
  markdown = readFileSync(filePath, 'utf8');
}

const approvalPackage = getNuxeraControlledApprovalPackage({
  markdown,
  approver: readArg('approver'),
  approvalDate: readArg('approval-date'),
  approvalScope: readArg('approval-scope'),
  evidenceHash: readArg('evidence-hash'),
  decision: readArg('decision')
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(approvalPackage, null, 2));
} else {
  console.log(`NUXERA approval package: ${approvalPackage.status}`);
  console.log(`Ready for release decision: ${approvalPackage.readyForReleaseDecision ? 'yes' : 'no'}`);
  console.log(`Blockers: ${approvalPackage.blockers.length}`);
  for (const blocker of approvalPackage.blockers) console.log(`- ${blocker}`);
  console.log(approvalPackage.nextDecision);
}

if (!approvalPackage.readyForReleaseDecision) {
  process.exitCode = 1;
}
