import { serve, ServerRequest } from "http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
} from "ws/mod.ts";
import { exists } from "fs/exists.ts";
import { join } from "path/mod.ts";

const address = Deno.args[0] || "localhost:9090";
const dirPublic = "./public/";
const webSockets = new Map();

const CONTENT_TYPES: Record<string, string> = {
  "css": "text/css",
  "html": "text/html",
  "js": "application/javascript",
  "png": "image/png",
  "svg": "image/svg+xml",
};

const serveFile = async (req: ServerRequest) => {
  const fileName = req.url.substring(req.url.lastIndexOf("/") + 1) ||
    "index.html";
  const file = join(Deno.cwd(), dirPublic, fileName);
  const fileExist = await exists(file);
  if (!fileExist) return req.respond({ status: 404 });
  console.log("serving", file);
  const body = await Deno.open(file, "r");
  const headers = new Headers();
  headers.set(
    "content-type",
    CONTENT_TYPES[file.substring(file.lastIndexOf(".") + 1)],
  );
  req.respond(
    {
      headers,
      body,
    },
  );
};

const serveWebsocket = async (req: ServerRequest) => {
  const { headers, conn } = req;
  try {
    const webSocket = await acceptWebSocket({
      conn,
      headers,
      bufReader: req.r,
      bufWriter: req.w,
    });
    // To improve
    const websocketId = new Date().getTime();
    webSockets.set(websocketId, webSocket);
    console.log(
      `new socket ${websocketId} connected, total ${webSockets.size}`,
    );
    const it = webSocket.receive();
    while (true) {
      try {
        const { done, value } = await it.next();
        if (done) {
          break;
        }
        if (typeof value === "string") {
          console.log("ws:Text", value);
          // Dispatch to all
          await Promise.allSettled(
            Array.from(webSockets.values()).map((webSocket: WebSocket) =>
              webSocket.send(value)
            ),
          );
        } else if (isWebSocketCloseEvent(value)) {
          const { code, reason } = value;
          webSockets.delete(websocketId);
          console.log("ws:Close", code, reason);
        }
      } catch (e) {
        webSockets.delete(websocketId);
        console.error(`failed to receive frame: ${e}`);
        await webSocket.close(1000).catch(console.error);
      }
    }
  } catch (err) {
    console.error(`failed to accept websocket: ${err}`);
  }
};

console.log(`websocket server is running on : http://${address}`);
for await (const req of serve(`${address}`)) {
  if (req.url === "/ws") serveWebsocket(req);
  else serveFile(req);
}
