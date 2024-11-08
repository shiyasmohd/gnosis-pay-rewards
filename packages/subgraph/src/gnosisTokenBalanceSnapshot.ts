import { BigInt, Address } from '@graphprotocol/graph-ts';
import { GnosisTokenBalanceSnapshot } from '../generated/schema';
import { Erc20 } from '../generated/GnosisPaySpender/Erc20';
import { timestampToWeekId } from './timestampToWeekId';
import { gnoToken } from './constants';

/**
 * Get or create a Gnosis token balance snapshot.
 *
 * @param blockNumber - The block number.
 * @param blockTimestamp - The block timestamp.
 * @param safe - The Gnosis Pay safe address.
 * @returns The Gnosis token balance snapshot.
 */
export function getOrCreateGnosisTokenBalanceSnapshot(
  // eslint-disable-next-line @typescript-eslint/ban-types
  blockNumber: BigInt,
  // eslint-disable-next-line @typescript-eslint/ban-types
  blockTimestamp: BigInt,
  safe: Address
): GnosisTokenBalanceSnapshot {
  const week = timestampToWeekId(blockTimestamp);
  const entityId = `${blockNumber.toString()}/${safe.toString().toLowerCase()}`;
  let gnosisTokenBalanceSnapshot = GnosisTokenBalanceSnapshot.load(entityId);

  if (gnosisTokenBalanceSnapshot == null) {
    gnosisTokenBalanceSnapshot = new GnosisTokenBalanceSnapshot(entityId);
    gnosisTokenBalanceSnapshot.safe = safe.toString();
    gnosisTokenBalanceSnapshot.week = week;
    const gnoBalance = getGnoTokenBalance(safe);
    gnosisTokenBalanceSnapshot.balanceRaw = gnoBalance.toBigDecimal();
    gnosisTokenBalanceSnapshot.balance = gnoBalance;
    gnosisTokenBalanceSnapshot.blockNumber = blockNumber.toI32();
    gnosisTokenBalanceSnapshot.blockTimestamp = blockTimestamp.toI32();
    gnosisTokenBalanceSnapshot.save();
  }

  return gnosisTokenBalanceSnapshot;
}

/**
 * Get the GNO token balance for a Gnosis Pay safe address.
 *
 * @param gnosisPaySafeAddress - The Gnosis Pay safe address.
 * @returns The GNO token balance.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getGnoTokenBalance(gnosisPaySafeAddress: Address): BigInt {
  const gnoTokenContract = Erc20.bind(gnoToken.address);

  return gnoTokenContract.balanceOf(gnosisPaySafeAddress);
}
