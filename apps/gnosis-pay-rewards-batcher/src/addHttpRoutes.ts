import {
  GnosisPayTransactionFieldsType_Unpopulated,
  calculateNetUsdVolume,
  isValidWeekDataId,
  calculateWeekRewardAmount,
  gnoToken,
  WeekIdFormatType,
  moneriumEureToken,
  moneriumGbpToken,
  usdcBridgeToken,
  circleUsdcToken,
  getOraclePriceAtBlockNumber,
  SerializableErc20TokenType,
  GnosisTokenBalanceSnapshotDocumentType,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  getWeekCashbackRewardModel,
  getWeekMetricsSnapshotModel,
  GnosisPaySafeAddressDocumentFieldsType_Unpopulated,
  gnosisPaySafeAddressModelName,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Response } from 'express';
import { Account, Address, createPublicClient, http, isAddress, isAddressEqual, isHash } from 'viem';
import { z } from 'zod';
import { buildExpressApp } from './server.js';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import { gnosis } from 'viem/chains';

dayjs.extend(dayjsUtc);

export function addHttpRoutes({
  expressApp,
  weekCashbackRewardModel,
  weekMetricsSnapshotModel,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
  weekMetricsSnapshotModel: ReturnType<typeof getWeekMetricsSnapshotModel>;
  proposerAccount: Account;
}) {
  expressApp.get<'/status'>('/status', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/health'>('/health', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/weeks'>('/weeks', async (_, res) => {
    try {
      const weeksArray = await weekMetricsSnapshotModel.find({}, { date: 1 }).lean();

      const weeksArrayWithIds = weeksArray.map((week) => ({
        id: week.date.toString(),
        weekId: week.date.toString(),
      }));

      return res.json({
        data: weeksArrayWithIds,
        status: 'ok',
        statusCode: 200,
      });
    } catch (error) {
      return returnInternalServerError(res, error as Error);
    }
  });

  expressApp.get<'/preview', z.infer<typeof previewExportSafeTransactionBuilderControllerPayloadSchema>>(
    '/preview',
    async function previewExportSafeTransactionBuilderController(req, res) {
      try {
        const payloadValidation = previewExportSafeTransactionBuilderControllerPayloadSchema.safeParse(req.query);

        if (!payloadValidation.success) {
          return res.status(400).json({
            error: payloadValidation.error.flatten().fieldErrors,
            status: 'error',
            statusCode: 400,
          });
        }

        const week = payloadValidation.data.weekId as WeekIdFormatType;

        const weekSafeSnapshot = await weekCashbackRewardModel
          .find({
            week,
          })
          .populate<{ transactions: GnosisPayTransactionFieldsType_Unpopulated[] }>('transactions', {
            amountUsd: 1,
            amountToken: 1,
            amount: 1,
            transactionHash: 1,
            gnoBalance: 1,
            type: 1,
          })
          .populate<{ gnoBalanceSnapshots: GnosisTokenBalanceSnapshotDocumentType[] }>('gnoBalanceSnapshots', {
            blockNumber: 1,
            blockTimestamp: 1,
            balance: 1,
          })
          .populate<{ address: GnosisPaySafeAddressDocumentFieldsType_Unpopulated }>(
            'address',
            'isOg',
            gnosisPaySafeAddressModelName
          )
          .lean();

        // Replace address with safe key
        const weekSafeSnapshotWithSafeKey = weekSafeSnapshot.map((safeSnapshot) => {
          (safeSnapshot as any).safe = safeSnapshot.address;
          delete (safeSnapshot as any).address;
          return safeSnapshot;
        });

        return res.json({
          data: weekSafeSnapshotWithSafeKey,
          status: 'ok',
          statusCode: 200,
        });
      } catch (error) {
        return returnInternalServerError(res, error as Error);
      }
    }
  );

  expressApp.get<'/export', z.infer<typeof exportSafeTransactionBuilderControllerPayloadSchema>>(
    '/export',
    async function exportSafeTransactionBuilderController(req, res) {
      try {
        const payloadValidation = exportSafeTransactionBuilderControllerPayloadSchema.safeParse(req.params);

        if (!payloadValidation.success) {
          return res.status(400).json({
            error: payloadValidation.error.flatten().fieldErrors,
            status: 'error',
            statusCode: 400,
          });
        }

        const tokenPriceMap = payloadValidation.data.tokenPrice;
        const excludeTransactionIds = [...new Set(payloadValidation.data.excludeTransactionIds)];

        const gnoUsdPrice = tokenPriceMap[gnoToken.address];

        if (!gnoUsdPrice) {
          return res.status(400).json({
            error: 'GNO token price not found in the token price map',
            status: 'error',
            statusCode: 400,
          });
        }

        const weekSafeSnapshots = await weekCashbackRewardModel
          .find({
            weekId: payloadValidation.data.weekId,
          })
          .populate<{ transactions: GnosisPayTransactionFieldsType_Unpopulated[] }>('transactions')
          .populate<{ address: GnosisPaySafeAddressDocumentFieldsType_Unpopulated }>(
            'address',
            'isOg',
            gnosisPaySafeAddressModelName
          )
          .lean();

        // Filter out the transactions that are in the excludeTransactionIds array and calculate the netUsdVolume for each safe snapshot
        const weekSafeSnapshotsWithTransactions = weekSafeSnapshots.map((safeSnapshot) => {
          const safeWeekTransactions = safeSnapshot.transactions.filter(
            (transaction) => !excludeTransactionIds.includes(transaction.transactionHash)
          );

          // Update the amountUsd for each transaction using the token price provided by the user if available,
          // otherwise use the captured amountUsd at the time of the transaction
          const safeWeekTransactionsWithUsdVolume = safeWeekTransactions.map((transaction) => {
            const tokenAddress = transaction.amountToken;

            // Use the token price provided by the user if available,
            // otherwise use the captured amountUsd at the time of the transaction
            const amountUsd = tokenPriceMap[tokenAddress]
              ? transaction.amount * tokenPriceMap[tokenAddress]
              : transaction.amountUsd;

            return {
              ...transaction,
              amountUsd,
            };
          });

          const netUsdVolume = calculateNetUsdVolume(safeWeekTransactionsWithUsdVolume);

          const gnoRewardAmount = calculateWeekRewardAmount({
            gnoUsdPrice,
            isOgNftHolder: safeSnapshot.address.isOg,
            gnoBalance: safeSnapshot.minGnoBalance, // always use minGnoBalance for the reward amount
            weekUsdVolume: netUsdVolume,
            fourWeeksUsdVolume: netUsdVolume,
          });

          return {
            ...safeSnapshot,
            transactions: safeWeekTransactions,
            netUsdVolume,
            gnoRewardAmount,
          };
        });

        return res.json({
          data: weekSafeSnapshotsWithTransactions,
          status: 'ok',
          statusCode: 200,
        });
      } catch (error) {
        return returnInternalServerError(res, error as Error);
      }
    }
  );

  let tokenPriceCache: {
    expiresAt: number;
    data: (SerializableErc20TokenType & { price: number })[];
  } | null = null;

  expressApp.get<'/token-prices'>('/token-prices', async function tokenPricesController(req, res) {
    try {
      if (tokenPriceCache !== null && tokenPriceCache.expiresAt > Date.now()) {
        return res.json({
          data: tokenPriceCache.data,
          fromCache: true,
          status: 'ok',
          statusCode: 200,
        });
      }

      const client = createPublicClient({
        transport: http(process.env.JSON_RPC_PROVIDER_GNOSIS),
        chain: gnosis,
      });

      const blockNumber = await client.getBlockNumber();
      const tokens = [gnoToken, moneriumEureToken, moneriumGbpToken, usdcBridgeToken, circleUsdcToken];

      const tokenWithUsdPrice = await Promise.all(
        tokens.map(async (token) => {
          let price = 1;

          if (
            isAddressEqual(token.address, usdcBridgeToken.address) ||
            isAddressEqual(token.address, circleUsdcToken.address)
          ) {
            price = 1;
          } else {
            const { data, error } = await getOraclePriceAtBlockNumber({
              oracle: token.oracle as Address,
              blockNumber,
              client: client as any,
            });

            if (error) {
              throw error;
            }

            price = data.price;
          }

          return {
            ...token,
            price: Number(price.toFixed(2)),
          };
        })
      );

      tokenPriceCache = {
        // Cache for 1 minute
        expiresAt: Date.now() + 1000 * 60,
        data: tokenWithUsdPrice,
      };

      return res.json({
        data: tokenWithUsdPrice,
        fromCache: false,
        status: 'ok',
        statusCode: 200,
      });
    } catch (error) {
      return returnInternalServerError(res, error as Error);
    }
  });

  expressApp.post<'/propose-safe-transaction', z.infer<typeof exportSafeTransactionBuilderControllerPayloadSchema>>(
    '/propose-safe-transaction',
    async function proposeSafeTransactionController(req, res) {
      try {
        const payloadValidation = exportSafeTransactionBuilderControllerPayloadSchema.safeParse(req.params);

        if (!payloadValidation.success) {
          return res.status(400).json({
            error: payloadValidation.error.flatten().fieldErrors,
            status: 'error',
            statusCode: 400,
          });
        }
      } catch (error) {
        return returnInternalServerError(res, error as Error);
      }
    }
  );

  return expressApp;
}

/**
 * @param res Express response object
 * @param error Error object
 * @returns Express response object
 */
function returnInternalServerError(res: Response, error?: Error) {
  return res.status(500).json({
    error: 'Internal server error',
    status: 'error',
    errorStack: error?.stack,
    statusCode: 500,
  });
}

const previewExportSafeTransactionBuilderControllerPayloadSchema = z.object({
  weekId: z
    .string()
    .refine(
      (value: string) => {
        return isValidWeekDataId(value);
      },
      {
        message: 'Invalid week date format',
      }
    )
    .refine(
      (value: string) => {
        const isSunday = dayjs(value).day() === 0;
        return isSunday;
      },
      {
        message: 'Week date must be a Sunday',
      }
    ),
});

const exportSafeTransactionBuilderControllerPayloadSchema = z.object({
  weekId: previewExportSafeTransactionBuilderControllerPayloadSchema.shape.weekId,
  excludeTransactionIds: z.array(
    z
      .string()
      .toLowerCase()
      .refine((value: string) => isHash(value), {
        message: 'Invalid transaction id',
      })
  ),
  tokenPrice: z.record(
    z
      .string()
      .toLowerCase()
      .refine((value: string) => isAddress(value), {
        message: 'Invalid token address',
      }),
    z.number()
  ),
});
