/* eslint-disable @typescript-eslint/ban-types */
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Erc20 } from '../generated/GnosisPaySpender/Erc20';
import { gnoToken } from './constants';

export function getGnoTokenBalance(gnosisPaySafeAddress: Address): BigInt {
  const gnoTokenContract = Erc20.bind(gnoToken.address);

  return gnoTokenContract.balanceOf(gnosisPaySafeAddress);
}
