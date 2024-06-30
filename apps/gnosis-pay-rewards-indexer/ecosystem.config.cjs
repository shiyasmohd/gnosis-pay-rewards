module.exports = {
  apps: [
    {
      name: 'gno-lcmm',
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
