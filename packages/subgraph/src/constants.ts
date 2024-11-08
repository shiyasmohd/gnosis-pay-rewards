import { Address } from '@graphprotocol/graph-ts';

export class TokenAddressWithOracle {
  address: Address;
  oracle: Address;

  /**
   * @param address The address of the token
   * @param oracle The address of the oracle for the token. If token has no oracle, use addressZero
   */
  constructor(address: Address, oracle: Address) {
    this.address = address;
    this.oracle = oracle;
  }

  /**
   * @returns true if the token has an oracle, false otherwise
   */
  hasOracle(): boolean {
    return !this.oracle.equals(addressZero);
  }
}

/**
 * Gnosis Pay Spend Address: the address that receives EURe, GBP and USDC from other GP Safes
 */
export const gnosisPaySpendAddress = Address.fromString('0x4822521E6135CD2599199c83Ea3517929A172EE');

/**
 * Gnosis Pay Spender Module Address
 */
export const gnosisPaySpenderModuleAddress = Address.fromString('0xcFF260bfbc199dC82717494299b1AcADe25F549b');


export const addressZero = Address.fromString('0x0000000000000000000000000000000000000000');

export const gnoToken = new TokenAddressWithOracle(
  Address.fromString('0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb'),
  Address.fromString('0x22441d81416430A54336aB28765abd31a792Ad37')
);

  export const tokenInfos: TokenAddressWithOracle[] = [
  gnoToken,
  new TokenAddressWithOracle(
    Address.fromString('0xcB444e90D8198415266c6a2724b7900fb12FC56E'),
    Address.fromString('0xab70BCB260073d036d1660201e9d5405F5829b7a')
  ),
  new TokenAddressWithOracle(
    Address.fromString('0x5Cb9073902F2035222B9749F8fB0c9BFe5527108'),
    Address.fromString('0x0E418d54863a3fAfeC9e96a358795f0f236f5f66')
  ),
  new TokenAddressWithOracle(
    Address.fromString('0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0'),
    addressZero,
  ),
  new TokenAddressWithOracle(
    Address.fromString('0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'),
    addressZero,
  ),
];
