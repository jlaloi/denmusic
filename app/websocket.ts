import { ServerRequest } from "http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
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
    logger.debug("ws:New", websocketId);
    try {
      for await (const webSocketEvent of webSocket) {
        if (webSocket.isClosed || isWebSocketCloseEvent(webSocketEvent)) {
          webSockets.delete(websocketId);
          logger.debug("ws:Close", websocketId);
          break;
        }
        // fix ngrok instability To be improved
        for (const [wsID, { isClosed }] of webSockets.entries()) {
          if (isClosed) {
            webSockets.delete(wsID);
            logger.error("ws:uncaught closure", wsID);
          }
        }
        // Broadcast to all
        if (typeof webSocketEvent === "string") {
          logger.debug("ws:msg", websocketId, webSocketEvent);
          await Promise.all(
            Array.from(webSockets.values()).map((webSocket: WebSocket) =>
              webSocket.send(webSocketEvent)
            ),
          );
        }
      }
    } catch (e) {
      if (!webSocket.isClosed) await webSocket.close(1000).catch(logger.error);
      throw e;
    }
  } catch (err) {
    webSockets.delete(websocketId);
    logger.error(
      `${req?.conn?.rid}, ws:error: ${err}`,
      websocketId,
      `total: ${webSockets.size}`,
    );
  }
};
