import { serve } from "http/server.ts";
import { logger, logAccess } from "./app/logger.ts";
import { serveFile } from "./app/serve.ts";
import { serveWebsocket } from "./app/websocket.ts";

const port = Deno.args[0] || "9090";
const dirPublic = Deno.args[1] || "./public/";

logger.info(`server is running on : http://localhost:${port}`);
for await (const req of serve(`:${port}`)) {
  logAccess(req);
  if (req.url === "/ws") serveWebsocket(req);
  else serveFile(dirPublic, req);
}
