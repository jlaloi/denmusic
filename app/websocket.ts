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
    logger.info("ws:New", websocketId);
    try {
      for await (const webSocketEvent of webSocket) {
        if (isWebSocketCloseEvent(webSocketEvent)) {
          webSockets.delete(websocketId);
          logger.info("ws:Close", websocketId);
          break;
        } else if (typeof webSocketEvent === "string") {
          logger.debug("ws:msg", websocketId, webSocketEvent);
          // Broadcast to all
          await Promise.all(
            Array.from(webSockets.values()).map((webSocket: WebSocket) =>
              webSocket.send(webSocketEvent)
            ),
          );
        } else if (isWebSocketPingEvent(webSocketEvent)) {
          logger.debug("ws:ping", websocketId);
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
