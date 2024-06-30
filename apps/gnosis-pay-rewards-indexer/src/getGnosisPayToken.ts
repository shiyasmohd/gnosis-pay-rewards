import { Address, isAddressEqual } from 'viem';

type SimpleErc20TokenType = {
  symbol: string;
  address: Address;
  decimals: number;
  name: string;
};

const tokens: SimpleErc20TokenType[] = [
  {
    symbol: 'EURe',
    address: '0xcB444e90D8198415266c6a2724b7900fb12FC56E',
    decimals: 18,
    name: 'Monerium EUR emoney (EURe)',
  },
  {
    symbol: 'GBPe',
    address: '0x5cb9073902f2035222b9749f8fb0c9bfe5527108',
    decimals: 18,
    name: 'Monerium GBP emoney (GBPe)',
  },
];

export function getGnosisPayToken(address: Address) {
  return tokens.find((token) => isAddressEqual(token.address, address));
}
