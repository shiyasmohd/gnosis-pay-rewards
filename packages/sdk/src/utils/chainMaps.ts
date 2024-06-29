export const supportedChainNames = ['ethereum', 'optimism', 'polygon', 'bsc', 'avax', 'arbitrum', 'gnosis'] as const;

export const chainIdToName: Record<number, (typeof supportedChainNames)[number]> = {
  1: 'ethereum',
  10: 'optimism',
  137: 'polygon',
  56: 'bsc',
  43114: 'avax',
  42161: 'arbitrum',
  100: 'gnosis',
};

export const chainNameToChainId: Record<(typeof supportedChainNames)[number], number> = {
  ethereum: 1,
  gnosis: 100,
  arbitrum: 42161,
  optimism: 10,
  avax: 43114,
  bsc: 56,
  polygon: 137,
};
