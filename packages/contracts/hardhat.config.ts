import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@openzeppelin/hardhat-upgrades';
import './tasks';

let realAccounts: string[] = [];

if (process.env.DEPLOYER_PRIVATE_KEY) {
  realAccounts = [process.env.DEPLOYER_PRIVATE_KEY];
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: '0.8.20',
  paths: {
    sources: './src',
  },
  networks: {
    hardhat: {
      throwOnCallFailures: false,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      chainId: 5,
      accounts: realAccounts,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      chainId: 1,
      accounts: realAccounts,
    },
    gnosis: {
      url: 'http://rpc.gnosischain.com',
      chainId: 100,
      accounts: realAccounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
