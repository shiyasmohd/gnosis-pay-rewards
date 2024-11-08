/* eslint-disable @typescript-eslint/ban-types */
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { PriceOracle as PriceOracleContract } from '../generated/templates/GnosisPayToken/PriceOracle';

export function getTokenUsdPrice(tokenOracleAddress: Address): BigInt {
  const tokenOracleContract = PriceOracleContract.bind(tokenOracleAddress);

  const roundData = tokenOracleContract.latestRoundData();

  // [roundId, answer, startedAt, updatedAt, answeredInRound]

  return roundData.getAnswer();
}
