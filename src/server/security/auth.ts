import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { verifyPassword } from "./password";

export interface UserSession {
  id: string;
  username: string;
  role: "admin" | "developer" | "reviewer";
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  public static async authenticateUser(username: string, password: string): Promise<{ session: UserSession; token: string } | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?;",
      args: [username],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    if (!verifyPassword(password, String(row.passwordHash))) {
      return null;
    }

    const user: UserSession = {
      id: String(row.id),
      username: String(row.username),
      role: row.role as UserSession["role"],
    };

    const token = crypto.randomBytes(32).toString("hex");
    const sessionId = `sess_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    await db.execute({
      sql: "INSERT INTO sessions (id, userId, tokenHash, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?);",
      args: [sessionId, user.id, hashToken(token), now.toISOString(), expiresAt.toISOString()],
    });

    // Expire old sessions for this user (keep the most recent 10).
    await db.execute({
      sql: `DELETE FROM sessions WHERE userId = ? AND id NOT IN (
        SELECT id FROM sessions WHERE userId = ? ORDER BY createdAt DESC LIMIT 10
      );`,
      args: [user.id, user.id],
    });

    return { session: user, token };
  }

  public static async getUserFromToken(token: string | undefined): Promise<UserSession | null> {
    if (!token) return null;
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT s.userId, s.expiresAt, u.username, u.role FROM sessions s JOIN users u ON u.id = s.userId WHERE s.tokenHash = ?;",
      args: [hashToken(token)],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    if (new Date(String(row.expiresAt)).getTime() < Date.now()) {
      await db.execute({ sql: "DELETE FROM sessions WHERE tokenHash = ?;", args: [hashToken(token)] });
      return null;
    }

    return {
      id: String(row.userId),
      username: String(row.username),
      role: row.role as UserSession["role"],
    };
  }

  public static async revokeToken(token: string | undefined): Promise<void> {
    if (!token) return;
    const db = getDb();
    await db.execute({ sql: "DELETE FROM sessions WHERE tokenHash = ?;", args: [hashToken(token)] });
  }
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim() || undefined;
}

/**
 * Express RBAC Middleware — fail-closed.
 *
 * Attach to every protected route. Requires a valid `Authorization: Bearer <token>`
 * header and rejects with 401/403 otherwise. There is no local-mode bypass:
 * unauthenticated requests are always rejected.
 */
export function requireRole(allowedRoles: Array<"admin" | "developer" | "reviewer">) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    (req as Request & { user?: UserSession }).user = user;
    next();
  };
}
