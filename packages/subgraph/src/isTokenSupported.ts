import { Address } from '@graphprotocol/graph-ts';
import { tokenInfos } from './constants';

export function isTokenSupported(tokenAddress: Address): boolean {
  let isSupported = false;

  for (let i = 0; i < tokenInfos.length; i++) {
    const tokenInfo = tokenInfos[i];
    if (tokenInfo.address.equals(tokenAddress)) {
      isSupported = true;
      break;
    }
  }

  return isSupported;
}
