import { config } from 'dotenv';
import { Address } from 'viem';

// Load the config
config();

const env = process.env;

// Load the .env.development file in development mode
if (env.NODE_ENV === 'development') {
  config({ path: '.env.development' });
}

const requiredKeys = [
  'JSON_RPC_PROVIDER_GNOSIS',
  'SENTRY_DSN',
  'MONGODB_URI',
  'GNOSIS_SAFE_ADDRESS_PROPOSER_PRIVATE_KEY',
];

// Check if all required keys are set
requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is not set`);
  }
});

/**
 * The environment the app is running in, defaults to development
 */
export const NODE_ENV = env.NODE_ENV || 'development';
/**
 * Whether the app is running in a Docker container
 */
export const IS_DOCKER = env.IS_DOCKER === 'true';

/**
 * The port for the HTTP server, defaults to 3000
 */
export const HTTP_SERVER_PORT = env.HTTP_SERVER_PORT ? parseInt(env.HTTP_SERVER_PORT) : 3000;
/**
 * The host for the HTTP server, defaults to 0.0.0.0
 */
export const HTTP_SERVER_HOST = env.HTTP_SERVER_HOST || '0.0.0.0'; // 0.0.0.0 allows access from outside the container

/**
 * MongoDB
 */
export const MONGODB_URI = env.MONGODB_URI as string;
export const MONGODB_DEBUG = env.MONGODB_DEBUG === 'true' ? true : false;
/**
 * Sentry Debug DSN
 */
export const SENTRY_DSN = env.SENTRY_DSN as string;
/**
 * JSON RPC Providers
 */
export const JSON_RPC_PROVIDER_GNOSIS = env.JSON_RPC_PROVIDER_GNOSIS as string;
/**
 * Websocket JSON RPC Providers
 */
export const WEBSOCKET_JSON_RPC_PROVIDER_GNOSIS = env.WEBSOCKET_JSON_RPC_PROVIDER_GNOSIS as string;
/**
 * The safe address from which the rewards are distributed
 */
export const GNOSIS_SAFE_ADDRESS = env.GNOSIS_SAFE_ADDRESS as Address;
/**
 * The private key of the proposer account that submits the transactions. This is also one of the owners of the safe.
 */
export const GNOSIS_SAFE_ADDRESS_PROPOSER_PRIVATE_KEY = env.GNOSIS_SAFE_ADDRESS_PROPOSER_PRIVATE_KEY as `0x${string}`;
