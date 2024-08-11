import { Transfer } from '../generated/EuroToken/ERC20';
import { Spend } from '../generated/GnosisPaySpender/Spender';
import { GnosisPayTransaction, GnosisPaySafeWeekSnapshot } from '../generated/schema';
import { gnosisPaySpendAddress } from './constants';
import { isTokenSupported } from './isTokenSupported';
import { getTokenUsdPrice } from './oracle';
import { createTokenEntity } from './createTokenEntity';
import { getGnosisPaySafeAddressFromRolesModule } from './gp/getGnosisPaySafeAddressFromRolesModule';
import { getGnoTokenBalance } from './getGnoTokenBalance';
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { timestampToWeekId } from './timestampToWeekId';

export function handleTransfer(event: Transfer): void {
  if (!isTokenSupported(event.address)) {
    return;
  }

  if (event.params.from != gnosisPaySpendAddress) {
    return;
  }

  const tokenAddress = event.address;
  const tokenEntity = createTokenEntity(tokenAddress);
  const tokenUsdPrice = getTokenUsdPrice(tokenAddress);

  const gnosisPaySafeAddress = event.params.to;
  // Get the current gno balance of the safe
  const gnoBalance = getGnoTokenBalance(gnosisPaySafeAddress);
  // Refund value
  const value = event.params.value;
  const valueUsd = tokenUsdPrice.times(value);

  const gnosisPayTransactionEntity = new GnosisPayTransaction(event.transaction.hash);
  gnosisPayTransactionEntity.token = tokenEntity.id;
  gnosisPayTransactionEntity.value = value;
  gnosisPayTransactionEntity.valueUsd = valueUsd;
  gnosisPayTransactionEntity.blockNumber = event.block.number;
  gnosisPayTransactionEntity.timestamp = event.block.timestamp;
  gnosisPayTransactionEntity.safe = gnosisPaySafeAddress;
  gnosisPayTransactionEntity.type = 'REFUND';
  gnosisPayTransactionEntity.gnoBalance = gnoBalance;
  gnosisPayTransactionEntity.save();
  updateSafeAddressWeekSnapshot(gnosisPaySafeAddress, gnosisPayTransactionEntity);
}

export function handleSpend(event: Spend): void {
  const tokenAddress = event.params.asset;
  const tokenEntity = createTokenEntity(tokenAddress);
  const tokenUsdPrice = getTokenUsdPrice(tokenEntity.oracle);

  const value = event.params.amount;
  const valueUsd = tokenUsdPrice.times(value);

  const gnosisPaySafeAddress = getGnosisPaySafeAddressFromRolesModule(event.params.account);
  const gnoBalance = getGnoTokenBalance(gnosisPaySafeAddress);

  const gnosisPayTransactionEntity = new GnosisPayTransaction(event.transaction.hash);
  gnosisPayTransactionEntity.token = tokenEntity.id;
  gnosisPayTransactionEntity.value = value;
  gnosisPayTransactionEntity.valueUsd = valueUsd;
  gnosisPayTransactionEntity.blockNumber = event.block.number;
  gnosisPayTransactionEntity.timestamp = event.block.timestamp;
  gnosisPayTransactionEntity.safe = gnosisPaySafeAddress;
  gnosisPayTransactionEntity.type = 'SPEND';
  gnosisPayTransactionEntity.gnoBalance = gnoBalance;
  gnosisPayTransactionEntity.save();
  updateSafeAddressWeekSnapshot(gnosisPaySafeAddress, gnosisPayTransactionEntity);
}

export function updateSafeAddressWeekSnapshot(
  safeAddress: Address,
  recentGnosisPayTransaction: GnosisPayTransaction
): void {
  const ZERO = BigInt.fromI32(0);

  const weekId = timestampToWeekId(recentGnosisPayTransaction.timestamp);
  const entityId = `${safeAddress}-${weekId}`;

  let safeAddressWeekSnapshot = GnosisPaySafeWeekSnapshot.load(entityId);

  if (safeAddressWeekSnapshot == null) {
    safeAddressWeekSnapshot = new GnosisPaySafeWeekSnapshot(entityId);
    safeAddressWeekSnapshot.safe = safeAddress;
    safeAddressWeekSnapshot.transactions = [];
    safeAddressWeekSnapshot.transactionCount = 0;
    safeAddressWeekSnapshot.gnoBalance = ZERO;
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

  if (
    safeAddressWeekSnapshot.maxGnoBalance !== null &&
    recentGnosisPayTransaction.gnoBalance.gt(safeAddressWeekSnapshot.maxGnoBalance)
  ) {
    safeAddressWeekSnapshot.maxGnoBalance = recentGnosisPayTransaction.gnoBalance;
  }

  if (
    safeAddressWeekSnapshot.minGnoBalance !== null &&
    recentGnosisPayTransaction.gnoBalance.lt(safeAddressWeekSnapshot.minGnoBalance)
  ) {
    safeAddressWeekSnapshot.minGnoBalance = recentGnosisPayTransaction.gnoBalance;
  }

  safeAddressWeekSnapshot.gnoBalance = recentGnosisPayTransaction.gnoBalance;

  safeAddressWeekSnapshot.save();
}
