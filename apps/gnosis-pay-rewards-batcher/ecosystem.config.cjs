module.exports = {
  apps: [
    {
      name: 'gnosis-pay-rewards-batcher',
      script: 'dist/index.js',
      watch: '.',
      kill_timeout: 10000,
      instances: 1,
    },
  ],
  deploy: {
    production: {},
  },
};
