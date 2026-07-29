import { getNuxeraControlledContinuationPack } from '../src/services/nuxeraControlledContinuationPackService.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const progressPercent = Number(readArg('progress'));
const continuationPack = getNuxeraControlledContinuationPack({
  progressPercent: Number.isFinite(progressPercent) ? progressPercent : undefined,
  resumeFromCommit: readArg('resume-from'),
  branch: readArg('branch'),
  localRepo: readArg('local-repo'),
  downloadsRoot: readArg('downloads-root')
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(continuationPack, null, 2));
} else if (process.argv.includes('--markdown')) {
  console.log(continuationPack.markdown);
} else {
  console.log(`NUXERA continuation pack: ${continuationPack.status}`);
  console.log(`Progress: ${continuationPack.progress.percent}%`);
  console.log(`Resume from: ${continuationPack.resumeContext.resumeFromCommit}`);
  console.log(`Next steps: ${continuationPack.nextResumeSteps.length}`);
  console.log(continuationPack.nextResumeSteps[0]);
}
