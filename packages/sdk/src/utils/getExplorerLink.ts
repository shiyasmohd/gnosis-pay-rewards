type ExplorerLinkType = 'transaction' | 'token' | 'address' | 'block';

export const EXPLORER_LINK_TYPE: Record<ExplorerLinkType, string> = {
  transaction: 'transaction',
  token: 'token',
  address: 'address',
  block: 'block',
} as const;

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
}

const ETHERSCAN_PREFIXES: { [chainId: number]: string } = {
  1: '',
};

function getExplorerPrefix(chainId: number) {
  switch (chainId) {
    case 100: // Gnosis Mainnet
      return 'https://gnosisscan.io/';
    default:
      return `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`;
  }
}

export function getExplorerLink(chainId: number, hash: string, type: ExplorerLinkType): string {
  const prefix = getExplorerPrefix(chainId);
  switch (type) {
    case EXPLORER_LINK_TYPE.transaction: {
      return `${prefix}/tx/${hash}`;
    }
    case EXPLORER_LINK_TYPE.token: {
      return `${prefix}/token/${hash}`;
    }
    case EXPLORER_LINK_TYPE.block: {
      return `${prefix}/block/${hash}`;
    }
    case EXPLORER_LINK_TYPE.address:
    default: {
      return `${prefix}/address/${hash}`;
    }
  }
}
