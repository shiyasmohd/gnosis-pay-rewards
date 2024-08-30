import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import { MetaTransactionData, OperationType } from '@safe-global/safe-core-sdk-types';
import { gnoToken } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Account } from 'viem/accounts';
import { JSON_RPC_PROVIDER_GNOSIS, GNOSIS_SAFE_ADDRESS } from 'config/env';
import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';

export async function proposeSafeTransaction({
  proposerAccount,
  safe,
  disperseAppAddress,
}: {
  safe: Safe;
  proposerAccount: Account;
  disperseAppAddress: Address;
}) {
  const apiKit = new SafeApiKit({
    chainId: 1n,
  });

  const safeAddress = (await safe.getAddress()) as Address;
  const totalAmount = parseUnits('100000', gnoToken.decimals);

  const approveDisperseAppTx: MetaTransactionData = {
    value: '0',
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [disperseAppAddress, totalAmount],
    }),
    to: gnoToken.address,
    operation: OperationType.Call,
  };

  const protocolKitOwner1 = await Safe.init({
    provider: JSON_RPC_PROVIDER_GNOSIS,
    safeAddress,
  });

  const safeTransaction = await protocolKitOwner1.createTransaction({
    transactions: [approveDisperseAppTx],
  });

  const safeTxHash = await protocolKitOwner1.getTransactionHash(safeTransaction);
  const signature = await protocolKitOwner1.signHash(safeTxHash);

  // Propose transaction to the service
  await apiKit.proposeTransaction({
    safeAddress: GNOSIS_SAFE_ADDRESS,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: proposerAccount.address,
    senderSignature: signature.data,
  });

  return safeTxHash;
}
