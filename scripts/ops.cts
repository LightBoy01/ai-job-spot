const minimist = require('minimist');
const { seedFirestore } = require('../seedFirestore.cts');
const { runHygiene } = require('./content-hygiene.cts');
const { enrichJobs } = require('./enrich_jobs.cts');
const { enrichBriefings } = require('./enrich_briefings.cts');
const { aggregateCommonRoles } = require('./aggregate-roles.cts');

async function main() {
  const args = minimist(process.argv.slice(2));
  const operation = args.run;
  const contentType = args.type;
  const isDryRun = args['dry-run'] === true;

  if (!operation) {
    console.error('Error: Please specify an operation to run with --run=[operation]');
    console.error('Available operations: seed, hygiene, enrich, aggregate-roles');
    process.exit(1);
  }

  console.log(`--- Running Operation: ${operation.toUpperCase()} ---`);
  if (isDryRun) {
    console.log('--- DRY RUN MODE ENABLED ---');
  }

  switch (operation) {
    case 'seed':
      await seedFirestore(isDryRun);
      break;

    case 'hygiene':
      if (!contentType) {
        console.error('Error: The \'hygiene\' operation requires a --type argument.');
        console.error('Example: --run=hygiene --type=jobs');
        process.exit(1);
      }
      if (contentType === 'jobs' || contentType === 'briefings') {
        await runHygiene(contentType, isDryRun);
      } else {
        console.error(`Error: Unknown content type '${contentType}' for hygiene.`);
        process.exit(1);
      }
      break;

    case 'enrich':
      if (!contentType) {
        console.error('Error: The \'enrich\' operation requires a --type argument.');
        console.error('Example: --run=enrich --type=jobs');
        process.exit(1);
      }
      if (contentType === 'jobs') {
        await enrichJobs(isDryRun);
      } else if (contentType === 'briefings') {
        await enrichBriefings(isDryRun);
      } else {
        console.error(`Error: Unknown content type '${contentType}' for enrichment.`);
        process.exit(1);
      }
      break;

    case 'aggregate-roles':
        await aggregateCommonRoles();
        break;

    default:
      console.error(`Error: Unknown operation '${operation}'.`);
      console.error('Available operations: seed, hygiene, enrich, aggregate-roles');
      process.exit(1);
  }

  console.log(`\n--- Operation ${operation.toUpperCase()} Completed Successfully ---`);
}

main().catch(error => {
  console.error('\n--- An unexpected error occurred during the operation ---');
  console.error(error);
  process.exit(1);
});