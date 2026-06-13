import { createApiServer } from './app.mjs';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';

const server = createApiServer();

server.listen(port, host, () => {
  console.log(`RelayHub API listening on http://${host}:${port}`);
});
