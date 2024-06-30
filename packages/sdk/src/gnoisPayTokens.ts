import { Address, isAddressEqual } from 'viem';

export type SerializableErc20TokenType = {
  address: Address;
  symbol: string;
  decimals: number;
  name: string;
  chainId: number;
};

export const gnosisPayTokens: SerializableErc20TokenType[] = [
  {
    symbol: 'EURe',
    address: '0xcB444e90D8198415266c6a2724b7900fb12FC56E',
    decimals: 18,
    name: 'Monerium EUR emoney (EURe)',
    chainId: 100,
  },
  {
    symbol: 'GBPe',
    address: '0x5cb9073902f2035222b9749f8fb0c9bfe5527108',
    decimals: 18,
    name: 'Monerium GBP emoney (GBPe)',
    chainId: 100,
  },
];

export function getGnosisPayTokenByAddress(tokenAddress: Address) {
  return gnosisPayTokens.find((token) => isAddressEqual(token.address, tokenAddress));
}
