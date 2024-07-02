import { FC, SVGProps } from 'react';
import { CoinbaseWalletLogo, MetaMaskLogo } from './assets/logos';

export const popularProviders: {
  [key: string]: {
    name?: string;
    backgroundColor: string;
    color: string;
    logo?: FC<SVGProps<SVGSVGElement>>;
  };
} = {
  metaMask: {
    name: 'MetaMask',
    backgroundColor: '#f6851b',
    color: '#FFFFFF',
    logo: MetaMaskLogo,
  },
  coinbaseWallet: {
    name: 'Coinbase Wallet',
    backgroundColor: '#315CF5',
    color: '#FFFFFF',
    logo: CoinbaseWalletLogo,
  },
  walletConnect: {
    name: 'More Wallets',
    backgroundColor: '#4196FC',
    color: '#FFFFFF',
    // logo: WalletConnectLogo,
  },
  injected: {
    name: 'Browser',
    backgroundColor: '#E8831D',
    color: '#FFFFFF',
  },
};
