import { Address } from '@graphprotocol/graph-ts';
import { Token } from '../generated/schema';
import { Erc20 } from '../generated/EuroToken/ERC20';
import { tokenInfos, addressZero } from './constants';

export function createTokenEntity(tokenAddress: Address): Token {
  let tokenOracleAddress = addressZero;

  for (let i = 0; i < tokenInfos.length; i++) {
    const _tokenInfo = tokenInfos[i];
    if (_tokenInfo.address.equals(tokenAddress)) {
      tokenOracleAddress = _tokenInfo.oracle;
      break;
    }
  }

  if (tokenOracleAddress.equals(addressZero)) {
    throw new Error(`Token ${tokenAddress.toHexString()} not supported`);
  }

  let tokenEntity = Token.load(tokenAddress);

  if (tokenEntity === null) {
    tokenEntity = new Token(tokenAddress);

    const tokenContract = Erc20.bind(tokenAddress);

    tokenEntity.name = tokenContract.name();
    tokenEntity.symbol = tokenContract.symbol();
    tokenEntity.decimals = tokenContract.decimals();
    // Meta
    tokenEntity.chainId = 100;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    tokenEntity.oracle = tokenInfo.oracle;
    // Save
    tokenEntity.save();
  }

  return tokenEntity as Token;
}
