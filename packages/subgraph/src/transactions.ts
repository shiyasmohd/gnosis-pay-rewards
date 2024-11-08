import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transfer } from '../generated/templates/GnosisPayToken/Erc20';

import { GnosisPayTransaction, GnosisPaySafeWeekSnapshot, GnosisTokenBalanceSnapshot } from '../generated/schema';
import { Spend } from '../generated/GnosisPaySpender/GnosisPaySpender';
import { getGnosisPaySafeAddressFromRolesModule } from './gp/getGnosisPaySafeAddressFromRolesModule';
import { getOrCreateGnosisTokenBalanceSnapshot } from './gnosisTokenBalanceSnapshot';
import { timestampToWeekId } from './timestampToWeekId';
import { gnosisPaySpendAddress } from './constants';
import { isTokenSupported } from './isTokenSupported';
import { getTokenUsdPrice } from './oracle';
import { areTokensMigrated, createTokenEntity, migrateTokens } from './createTokenEntity';

export function handleTransfer(event: Transfer): void {
  if (!isTokenSupported(event.address)) {
    return;
  }

  if (!event.params.from.equals(gnosisPaySpendAddress)) {
    return;
  }

  const tokenAddress = event.address;
  const tokenEntity = createTokenEntity(tokenAddress);
  const tokenUsdPrice = getTokenUsdPrice(tokenAddress);

  const gnosisPaySafeAddress = event.params.to;
  // Get the current gno balance of the safe
  const gnoBalanceSnapshot = getOrCreateGnosisTokenBalanceSnapshot(
    event.block.number,
    event.block.timestamp,
    gnosisPaySafeAddress
  );
  // Refund value
  const value = event.params.value;
  const valueUsd = tokenUsdPrice.times(value);

  const gnosisPayTransactionEntity = new GnosisPayTransaction(event.transaction.hash);
  gnosisPayTransactionEntity.token = tokenEntity.id;
  gnosisPayTransactionEntity.value = value;
  gnosisPayTransactionEntity.valueUsd = valueUsd;
  gnosisPayTransactionEntity.blockNumber = event.block.number;
  gnosisPayTransactionEntity.timestamp = event.block.timestamp;
  gnosisPayTransactionEntity.safe = gnosisPaySafeAddress.toString();
  gnosisPayTransactionEntity.type = 'REFUND';
  gnosisPayTransactionEntity.gnoBalance = gnoBalanceSnapshot.balance;
  gnosisPayTransactionEntity.save();
  updateSafeAddressWeekSnapshot(gnosisPaySafeAddress, gnosisPayTransactionEntity);
}

export function handleSpend(event: Spend): void {
  const tokenAddress = event.params.asset;
  const tokenEntity = createTokenEntity(tokenAddress);
  const tokenUsdPrice = getTokenUsdPrice(Address.fromBytes(tokenEntity.oracle));

  const value = event.params.amount;
  const valueUsd = tokenUsdPrice.times(value);

  const gnosisPaySafeAddress = getGnosisPaySafeAddressFromRolesModule(event.params.account);
  const gnoBalanceSnapshot = getOrCreateGnosisTokenBalanceSnapshot(
    event.block.number,
    event.block.timestamp,
    gnosisPaySafeAddress
  );

  const gnosisPayTransactionEntity = new GnosisPayTransaction(event.transaction.hash);
  gnosisPayTransactionEntity.token = tokenEntity.id;
  gnosisPayTransactionEntity.value = value;
  gnosisPayTransactionEntity.valueUsd = valueUsd;
  gnosisPayTransactionEntity.blockNumber = event.block.number;
  gnosisPayTransactionEntity.timestamp = event.block.timestamp;
  gnosisPayTransactionEntity.safe = gnosisPaySafeAddress.toString();
  gnosisPayTransactionEntity.type = 'SPEND';
  gnosisPayTransactionEntity.gnoBalance = gnoBalanceSnapshot.balance;
  gnosisPayTransactionEntity.save();
  updateSafeAddressWeekSnapshot(gnosisPaySafeAddress, gnosisPayTransactionEntity);
}

export function updateSafeAddressWeekSnapshot(
  safeAddress: Address,
  recentGnosisPayTransaction: GnosisPayTransaction
): void {
  const ZERO = BigInt.fromI32(0);

  const weekId = timestampToWeekId(recentGnosisPayTransaction.timestamp);
  const entityId = toGnosisSafeWeeklySnapshotEntityId(weekId, safeAddress);

  let safeAddressWeekSnapshot = GnosisPaySafeWeekSnapshot.load(entityId);

  if (safeAddressWeekSnapshot == null) {
    safeAddressWeekSnapshot = new GnosisPaySafeWeekSnapshot(entityId);
    safeAddressWeekSnapshot.safe = safeAddress.toString();
    safeAddressWeekSnapshot.transactions = [];
    safeAddressWeekSnapshot.transactionCount = 0;
    safeAddressWeekSnapshot.gnoBalanceSnapshots = [];
    safeAddressWeekSnapshot.minGnoBalance = ZERO;
    safeAddressWeekSnapshot.maxGnoBalance = ZERO;
    safeAddressWeekSnapshot.netUsdVolume = ZERO;
  }
  safeAddressWeekSnapshot.transactions.push(recentGnosisPayTransaction.id);
  safeAddressWeekSnapshot.transactionCount = safeAddressWeekSnapshot.transactionCount + 1;

  if (recentGnosisPayTransaction.type == 'SPEND') {
    safeAddressWeekSnapshot.netUsdVolume = safeAddressWeekSnapshot.netUsdVolume.plus(
      recentGnosisPayTransaction.valueUsd
    );
  } else {
    safeAddressWeekSnapshot.netUsdVolume = safeAddressWeekSnapshot.netUsdVolume.minus(
      recentGnosisPayTransaction.valueUsd
    );
  }

  const gnosisTokenBalanceSnapshot = getOrCreateGnosisTokenBalanceSnapshot(
    recentGnosisPayTransaction.blockNumber,
    recentGnosisPayTransaction.timestamp,
    safeAddress
  );

  // Push the snapshot to the array if it's not already there
  if (safeAddressWeekSnapshot.gnoBalanceSnapshots.indexOf(gnosisTokenBalanceSnapshot.id) === -1) {
    safeAddressWeekSnapshot.gnoBalanceSnapshots.push(gnosisTokenBalanceSnapshot.id);
  }

  let minGnoBalance = safeAddressWeekSnapshot.minGnoBalance;
  let maxGnoBalance = safeAddressWeekSnapshot.maxGnoBalance;

  // Among the snapshots, find the min and max GNO balance
  for (let i = 0; i < safeAddressWeekSnapshot.gnoBalanceSnapshots.length; i++) {
    const snapshot = GnosisTokenBalanceSnapshot.load(safeAddressWeekSnapshot.gnoBalanceSnapshots[i]);
    if (snapshot != null && snapshot.balance.lt(minGnoBalance)) {
      minGnoBalance = snapshot.balance;
    }
    if (snapshot != null && snapshot.balance.gt(maxGnoBalance)) {
      maxGnoBalance = snapshot.balance;
    }
  }

  safeAddressWeekSnapshot.save();
}

function toGnosisSafeWeeklySnapshotEntityId(week: string, safe: Address): string {
  return `${week}/${safe.toString().toLowerCase()}`;
}

/**
 * Handle the block event
 * This function is called once when the subgraph is deployed,
 * It migrates all the tokens to the database and starts the indexing for token Transfer events
 * @param block
 */
export function handleOnce(block: ethereum.Block): void {
  if (areTokensMigrated()) {
    return;
  }

  migrateTokens();
}
