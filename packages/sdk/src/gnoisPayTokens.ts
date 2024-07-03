import { Address, isAddressEqual } from 'viem';

export type SerializableErc20TokenType = {
  address: Address;
  symbol: string;
  decimals: number;
  name: string;
  chainId: number;
};

export const gnoToken: SerializableErc20TokenType = {
  address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
  symbol: 'GNO',
  decimals: 18,
  name: 'Gnosis',
  chainId: 100,
} as const;

/**
 * List of token used to process payments in Gnosis Pay as of July 1, 2024
 */
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
    address: '0x5Cb9073902F2035222B9749F8fB0c9BFe5527108',
    decimals: 18,
    name: 'Monerium GBP emoney (GBPe)',
    chainId: 100,
  },
  {
    symbol: 'USDC.e',
    address: '0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0',
    decimals: 6,
    name: 'Bridged USDC (Gnosis)',
    chainId: 100,
  },
  {
    symbol: 'USDC',
    address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
    decimals: 6,
    name: 'USDC',
    chainId: 100,
  },
] as const;

export function getGnosisPayTokenByAddress(tokenAddress: Address) {
  return gnosisPayTokens.find((token) => isAddressEqual(token.address, tokenAddress));
}
