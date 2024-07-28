import { isAddress } from "viem";

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
};