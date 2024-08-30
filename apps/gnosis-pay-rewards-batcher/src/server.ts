import createExpressApp from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cors from 'cors'; // no time for TS atm

export function buildExpressApp() {
  const express = createExpressApp();

  express.use(cors()); // just do it
  express.use(createExpressApp.json()); // just do it

  express.get('/', (_, res) => {
    res.json({
      status: 'ok',
    });
  });

  return express;
}
