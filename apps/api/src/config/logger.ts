import { pino } from "pino";
import { env } from "./env";

/** App-wide structured logger. Pretty in dev, JSON in prod, silent in tests. */
export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  // Never log auth tokens / secrets, even if a header dump sneaks in.
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
