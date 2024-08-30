process.env.TZ = 'UTC'; // Set the timezone to UTC
import './sentry.js'; // imported first to setup sentry
import { gnosisChainPublicClient } from './publicClient.js';
import { startApp } from './core.js';

startApp({ client: gnosisChainPublicClient }).catch((e) => {
  console.error(e);
  process.exit(1);
});
