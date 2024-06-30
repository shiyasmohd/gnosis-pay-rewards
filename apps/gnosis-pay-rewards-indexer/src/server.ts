import createExpressApp from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cors from 'cors'; // no time for TS atm
import { createServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';
import { SOCKET_IO_SERVER_PORT } from './config/env.js';

export const express = createExpressApp();

express.use(cors()); // just do it
express.use(createExpressApp.json()); // just do it

express.get('/echo', (_, res) => {
  res.json({
    message: 'Hello from the server!',
  });
});

// Create a server instance
const httpServer = createServer(express);

/**
 * The socket.io server instance to broadcast the current state of the market maker
 */
export const socketIoServer = new SocketIoServer(httpServer, {
  cors: {
    origin: '*',
  },
});

export function startServer({ httpPort, httpHost }: { httpPort: number; httpHost: string }) {
  return httpServer.listen(httpPort, httpHost);
}
