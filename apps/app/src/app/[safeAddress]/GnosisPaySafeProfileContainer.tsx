'use client';
import { SpendTransactionFieldsTypePopulated } from '@karpatkey/gnosis-pay-rewards-sdk';
import { useQuery } from '@tanstack/react-query';
import { RecentSpendTransactionsTable } from 'app/center/components/RecentSpendTransactionsTable';
import axios from 'axios';
import { NEXT_PUBLIC_INDEXER_HTTP_API_URL } from 'constants/env';
import { Container } from 'ui/components/Container';

export function GnosisPaySafeProfileContainer({ safeAddress }: { safeAddress: string }) {
  console.log({ NEXT_PUBLIC_INDEXER_HTTP_API_URL });

  const { data: queryResponse, error: queryError } = useQuery({
    queryKey: ['transactions', safeAddress],
    queryFn() {
      return axios.get<{
        data: SpendTransactionFieldsTypePopulated[];
        status: string;
        statusCode: number;
      }>(`${NEXT_PUBLIC_INDEXER_HTTP_API_URL}/transactions/${safeAddress}`);
    },
  });

  console.log({ raw: queryResponse?.data, error: queryError });

  const transactions = queryResponse?.data.data || [];

  return (
    <Container
      style={{
        marginTop: '20px',
      }}
    >
      <h1>{safeAddress}</h1>
      <p>{transactions?.length} transactions</p>
      <div className="mb-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Recent GP Transactions</h3>
        <RecentSpendTransactionsTable data={transactions} hideSafeAddressColumn={true} showFilterInput={false} />
      </div>
    </Container>
  );
}
