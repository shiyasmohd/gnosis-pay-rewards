/* eslint-disable @typescript-eslint/ban-types */
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Oracle as OracleContract } from '../generated/EuroToken/Oracle';


export function getTokenUsdPrice(tokenOracleAddress: Address): BigInt {
  const tokenOracleContract = OracleContract.bind(tokenOracleAddress);

  const roundData = tokenOracleContract.latestRoundData();

  // [roundId, answer, startedAt, updatedAt, answeredInRound]

  return roundData.getAnswer();
}
