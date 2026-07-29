import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { reviewNuxeraControlledEvidence } from '../src/services/nuxeraControlledEvidenceReviewService.js';

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

const review = reviewNuxeraControlledEvidence({ markdown });

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(review, null, 2));
} else {
  console.log(`NUXERA evidence review: ${review.status}`);
  console.log(`Ready for human review: ${review.readyForHumanReview ? 'yes' : 'no'}`);
  console.log(`Blockers: ${review.blockers.length}`);
  for (const blocker of review.blockers) console.log(`- ${blocker}`);
  console.log(review.nextDecision);
}

if (!review.readyForHumanReview) {
  process.exitCode = 1;
}
