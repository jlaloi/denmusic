import { serve } from "http/server.ts";
import { logger, logAccess } from "./logger.ts";
import { serveFile } from "./serve.ts";
import { serveWebsocket } from "./websocket.ts";

const port = Deno.args[0] || "9090";
const dirPublic = Deno.args[1] || "./public/";

logger.info(`server is running on : http://localhost:${port}`);
for await (const req of serve(`:${port}`)) {
  logAccess(req);
  if (req.url === "/ws") serveWebsocket(req);
  else serveFile(dirPublic, req);
}
