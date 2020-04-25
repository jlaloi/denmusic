import { ServerRequest } from "http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
} from "ws/mod.ts";
import { v4 as uuid } from "uuid/mod.ts";
import { logger } from "./logger.ts";

const webSockets = new Map();

export const serveWebsocket = async (req: ServerRequest) => {
  const websocketId = uuid.generate();
  const { conn, headers, r:bufReader, w:bufWriter } = req;
  try {
    const webSocket = await acceptWebSocket({
      conn,
      headers,
      bufReader,
      bufWriter,
    });
    webSockets.set(websocketId, webSocket);
    logger.info(
      `${req?.conn?.rid}`,
      "ws:New",
      websocketId,
      `total: ${webSockets.size}`,
    );
    const it = webSocket.receive();
    while (true) {
      try {
        const { done, value } = await it.next();
        if (done || isWebSocketCloseEvent(value)) {
          webSockets.delete(websocketId);
          logger.info(
            `${req?.conn?.rid}`,
            "ws:Closed",
            websocketId,
            `total: ${webSockets.size}`,
          );
          break;
        } else if (typeof value === "string") {
          logger.debug(`${req?.conn?.rid}`, "ws:msg", value);
          // Broadcast to all
          await Promise.all(
            Array.from(webSockets.values()).map((webSocket: WebSocket) =>
              webSocket.send(value)
            ),
          );
        }
      } catch (e) {
        await webSocket.close(1000).catch(logger.error);
        throw e;
      }
    }
  } catch (err) {
    webSockets.delete(websocketId);
    logger.error(
      `${req?.conn?.rid}`,
      `websocket error: ${err}`,
      websocketId,
      `total: ${webSockets.size}`,
    );
  }
};
