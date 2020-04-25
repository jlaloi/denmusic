import * as log from "log/mod.ts";
import { ServerRequest } from "http/server.ts";

const formatter = "[{levelName}] {datetime} - {msg} {args}";

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter,
    }),
    accessFile: new log.handlers.FileHandler("INFO", {
      filename: "./access.log",
      formatter,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
    access: {
      level: "INFO",
      handlers: ["console", "accessFile"],
    },
  },
});

export const logger = log.getLogger();

export const loggerAccess = log.getLogger("access");
export const logAccess = (req: ServerRequest) => {
  loggerAccess.info(
    `${req?.conn?.rid}`,
    req.url,
    (req.conn?.remoteAddr as any)?.hostname,
    req.headers.get("x-forwarded-for"),
    req.headers.get("origin"),
    req.headers.get("user-agent"),
  );
};
