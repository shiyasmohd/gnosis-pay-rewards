import { Address, PublicClient } from 'viem';
import { getGnosisPaySafeAddressModel } from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';

export async function isGnosisPaySafeAddress({
  address,
  gnosisPaySafeAddressModel,
}: {
  address: Address;
  client: PublicClient;
  gnosisPaySafeAddressModel: ReturnType<typeof getGnosisPaySafeAddressModel>;
}): Promise<boolean> {
  // Priority 1: Check if the address is a Gnosis Safe address in the database
  const safeAddressEntity = await gnosisPaySafeAddressModel.exists({
    address,
  });

  return safeAddressEntity !== null;
}
