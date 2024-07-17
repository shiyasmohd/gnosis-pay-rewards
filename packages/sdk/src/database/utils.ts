import { GnosisPayTransactionFieldsType_Unpopulated, GnosisPayTransactionType } from "./spendTransaction";

export function calculateNetUsdVolume(transactions: GnosisPayTransactionFieldsType_Unpopulated[]) {
  return transactions.reduce((acc, transaction) => {
    if (transaction.type === GnosisPayTransactionType.Spend) {
      return acc + transaction.amountUsd;
    } else {
      return acc - transaction.amountUsd;
    }
  }, 0);
}
