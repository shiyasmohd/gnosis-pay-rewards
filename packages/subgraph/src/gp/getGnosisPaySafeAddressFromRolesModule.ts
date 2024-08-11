import { Address } from '@graphprotocol/graph-ts';
import { SafeModule as SafeModuleContract } from '../../generated/EuroToken/SafeModule';

export async function getGnosisPaySafeAddressFromRolesModule(rolesModuleAddress: Address): Address {
  const safeModuleContract = SafeModuleContract.bind(rolesModuleAddress);

  return safeModuleContract.avatar();
}
