import { task } from 'hardhat/config';

task('deploy', 'Deploy contracts')
  .addFlag('ledger', 'Use a Ledger hardware wallet')
  .setAction(async function (taskArgs, { ethers }) {
    // Deploy
  });
