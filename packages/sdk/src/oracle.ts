import { Address, PublicClient, Transport, formatUnits, getContract } from 'viem';
import { gnosis } from 'viem/chains';
import { getGnosisPayTokenByAddress } from './gnoisPayTokens';

type ConditionalReturnType<T extends boolean, A, B> = T extends true
  ? { data: A; error: null }
  : { data: null; error: B };

type TokenOraclePriceDataType = {
  price: number;
  decimals: number;
  round: {
    roundId: bigint;
    answer: bigint;
    startedAt: bigint;
    updatedAt: bigint;
    answeredInRound: bigint;
  };
};

export async function getOraclePriceAtBlockNumber({
  client,
  blockNumber,
  token,
}: {
  client: PublicClient<Transport, typeof gnosis>;
  blockNumber: bigint;
  token: Address;
}): Promise<ConditionalReturnType<true, TokenOraclePriceDataType, Error> | ConditionalReturnType<false, null, Error>> {
  try {
    const tokenInfo = getGnosisPayTokenByAddress(token);

    if (!tokenInfo || !tokenInfo.oracle) {
      throw new Error('Token does not have an oracle');
    }

    const contract = getContract({
      abi: chornicleOracleAbi,
      address: tokenInfo.oracle,
      client,
    });

    const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.read.latestRoundData({
      blockNumber,
    });

    const decimals = await contract.read.decimals();
    const price = Number(formatUnits(answer, decimals));

    return {
      error: null,
      data: {
        price,
        decimals,
        round: {
          roundId,
          answer,
          startedAt,
          updatedAt,
          answeredInRound,
        },
      },
    };
  } catch (error) {
    return {
      error: error as Error,
      data: null,
    };
  }
}

const chornicleOracleAbi = [
  // ... other ABI definitions ...
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // decimals
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ... other ABI definitions ...
] as const;
