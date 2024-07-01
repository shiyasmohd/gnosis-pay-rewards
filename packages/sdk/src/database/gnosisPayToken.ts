import type { Address } from 'viem';

import { SerializableErc20TokenType } from '../gnoisPayTokens';

export type TokenDocumentFieldsType = SerializableErc20TokenType & {
  _id: Address;
};
