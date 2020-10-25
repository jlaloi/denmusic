import { ServerRequest } from "http/server.ts";
import { exists } from "fs/exists.ts";
import { basename, extname, join } from "path/mod.ts";
import { logger } from "./logger.ts";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "application/javascript",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export const serveFile = async (dir: string, req: ServerRequest) => {
  const fileName = basename(req.url) || "index.html";
  const file = join(Deno.cwd(), dir, fileName);
  const fileExist = await exists(file);
  if (!fileExist) return req.respond({ status: 404 });
  logger.debug(`${req?.conn?.rid}`, "serving", fileName);
  const [body, fileInfo] = await Promise.all(
    [
      Deno.open(file, {
        read: true,
      }),
      Deno.stat(file),
    ],
  );
  const headers = new Headers();
  headers.set("content-length", fileInfo.size.toString());
  headers.set("content-type", CONTENT_TYPES[extname(file)]);
  req.respond(
    {
      headers,
      body,
    },
  ).catch((err) => {
    // On large file handle ConnectionAborted/reset
    logger.error(`${req?.conn?.rid}`, "serving error", fileName, err);
  });
};
