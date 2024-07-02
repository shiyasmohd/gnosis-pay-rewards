import {
  GnosisPayRewardsClientToServerEventsType,
  GnosisPayRewardsInterServerEventsType,
  GnosisPayRewardsServerToClientEventsType,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import createExpressApp, { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cors from 'cors'; // no time for TS atm
import { createServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';

const express = createExpressApp();

express.use(cors()); // just do it
express.use(createExpressApp.json()); // just do it

express.get('/echo', (_, res) => {
  res.json({
    message: 'Hello from the server!',
  });
});

export function buildExpressApp() {
  return express;
}

/**
 * Builds a socket.io server instance and underlying http server via the provided express app
 * @param expressApp The express app to use
 * @returns The socket.io server instance
 */
export function buildSocketIoServer(expressApp: Express) {
  // Create a server instance
  const httpServer = createServer(expressApp);

  const socketIoServer = new SocketIoServer<
    GnosisPayRewardsClientToServerEventsType,
    GnosisPayRewardsServerToClientEventsType,
    GnosisPayRewardsInterServerEventsType
  >(httpServer, {
    cors: {
      origin: '*',
    },
  });

  return {
    httpServer,
    socketIoServer,
  };
}
