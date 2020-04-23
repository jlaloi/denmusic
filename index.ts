import { serve, ServerRequest } from "http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
} from "ws/mod.ts";
import { exists } from "fs/exists.ts";
import { basename, extname, join } from "path/mod.ts";

const port = Deno.args[0] || "9090";
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
  const fileName = basename(req.url) || "index.html";
  const file = join(Deno.cwd(), dirPublic, fileName);
  const fileExist = await exists(file);
  if (!fileExist) return req.respond({ status: 404 });
  console.log("serving", fileName);
  const body = await Deno.open(file, "r");
  const headers = new Headers();
  headers.set("content-type", CONTENT_TYPES[extname(file).substring(1)]);
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
    console.log("ws:New, total", webSockets.size);
    const it = webSocket.receive();
    while (true) {
      try {
        const { done, value } = await it.next();
        if (done || isWebSocketCloseEvent(value)) {
          webSockets.delete(websocketId);
          console.log("ws:Closed, total", webSockets.size);
          break;
        } else if (typeof value === "string") {
          // Broadcast to all
          await Promise.all(
            Array.from(webSockets.values()).map((webSocket: WebSocket) =>
              webSocket.send(value)
            ),
          );
        }
      } catch (e) {
        webSockets.delete(websocketId);
        console.error(`ws:Error: ${e}`);
        await webSocket.close(1000).catch(console.error);
        break;
      }
    }
  } catch (err) {
    console.error(`failed to accept websocket: ${err}`);
  }
};

console.log(`server is running on : http://localhost:${port}`);
for await (const req of serve(`:${port}`)) {
  if (req.url === "/ws") serveWebsocket(req);
  else serveFile(req);
}
