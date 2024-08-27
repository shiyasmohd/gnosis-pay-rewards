import { isAddress, isHash } from 'viem';
import { isValidWeekDataId } from '../database/weekData';

/**
 * Mongoose schema field for an address.
 */
export const mongooseSchemaAddressField = {
  type: String,
  required: true,
  validate: {
    validator: (value: string) => isAddress(value),
    message: '{VALUE} is not a valid address',
  },
} as const;

/**
 * Mongoose schema field for a hash.
 */
export const mongooseSchemaHashField = {
  type: String,
  required: true,
  validate: {
    validator: (value: string) => isHash(value),
    message: '{VALUE} is not a valid hash',
  },
} as const;

export const mongooseSchemaWeekIdField = {
  type: String,
  required: true,
  validate: {
    validator: (value: string) => isValidWeekDataId(value),
    message: '{VALUE} is not a valid week ID, must be in YYYY-MM-DD format',
  },
} as const;
