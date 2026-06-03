import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { verifyToken } from "./modules/auth/jwt";

let io: Server | undefined;

const userRoom = (userId: number): string => `user:${userId}`;

/** Attaches Socket.io to the HTTP server and authenticates each socket. */
export function initRealtime(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  // Authenticate via the same httpOnly JWT cookie used for the REST API.
  io.use((socket, next) => {
    try {
      const token = readTokenCookie(socket.handshake.headers.cookie);
      if (!token) throw new Error("missing token");
      socket.data.userId = verifyToken(token).sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as number;
    socket.join(userRoom(userId));
  });

  logger.info("Realtime (Socket.io) ready");
}

/** Tells a user's other tabs/devices that their todos changed. */
export function notifyTodosChanged(userId: number): void {
  io?.to(userRoom(userId)).emit("todos:changed");
}

export async function closeRealtime(): Promise<void> {
  await io?.close();
  io = undefined;
}

function readTokenCookie(cookieHeader?: string): string | undefined {
  for (const part of cookieHeader?.split(";") ?? []) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "token") return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
