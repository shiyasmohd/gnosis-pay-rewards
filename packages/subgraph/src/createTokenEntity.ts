import { Address } from '@graphprotocol/graph-ts';
import { Token } from '../generated/schema';
import { Erc20 } from '../generated/templates/GnosisPayToken/Erc20';
import { tokenInfos, addressZero } from './constants';
import { GnosisPayToken as GnosisPayTokenTemplate } from '../generated/templates';

export function createTokenEntity(tokenAddress: Address): Token {
  let tokenEntity = Token.load(tokenAddress);

  if (tokenEntity === null) {
    let tokenOracleAddress = addressZero;
    for (let i = 0; i < tokenInfos.length; i++) {
      const _tokenInfo = tokenInfos[i];
      if (_tokenInfo.address.equals(tokenAddress)) {
        tokenOracleAddress = _tokenInfo.oracle;
        break;
      }
    }

    tokenEntity = new Token(tokenAddress);

    const tokenContract = Erc20.bind(tokenAddress);

    tokenEntity.name = tokenContract.name();
    tokenEntity.symbol = tokenContract.symbol();
    tokenEntity.decimals = tokenContract.decimals();
    // Meta
    tokenEntity.chainId = 100;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    tokenEntity.oracle = tokenOracleAddress;
    // Save
    tokenEntity.save();

    // Start listening to events
    GnosisPayTokenTemplate.create(tokenAddress);
  }

  return tokenEntity as Token;
}

/**
 * Check if all the tokens are migrated
 * @returns
 */
export function areTokensMigrated(): boolean {
  return Token.load(tokenInfos[0].address) != null;
}

/**
 * Migrate all the tokens to the database
 */
export function migrateTokens(): void {
  if (areTokensMigrated()) {
    return;
  }

  for (let i = 0; i < tokenInfos.length; i++) {
    const _tokenInfo = tokenInfos[i];
    createTokenEntity(_tokenInfo.address);
  }
}
