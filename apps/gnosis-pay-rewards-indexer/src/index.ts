process.env.TZ = 'UTC'; // Set the timezone to UTC
import './sentry.js'; // imported first to setup sentry
import { gnosisChainPublicClient } from './publicClient.js';
import { startIndexing } from './core.js';
import { FETCH_BLOCK_SIZE, RESUME_INDEXING } from './config/env.js';

startIndexing({
  client: gnosisChainPublicClient,
  resumeIndexing: RESUME_INDEXING,
  fetchBlockSize: FETCH_BLOCK_SIZE,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
