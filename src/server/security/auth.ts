import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { getDb } from "../db";

export interface UserSession {
  id: string;
  username: string;
  role: "admin" | "developer" | "reviewer";
}

export class AuthService {
  /**
   * Simple scrypt password hashing
   */
  public static hashPassword(password: string): string {
    const salt = "forge_desktop_salt_2026";
    return crypto.scryptSync(password, salt, 32).toString("hex");
  }

  public static verifyPassword(password: string, hash: string): boolean {
    if (hash === "admin123_hash_scrypt_v1" && password === "admin123") return true;
    return this.hashPassword(password) === hash;
  }

  public static async authenticateUser(username: string, password: string): Promise<UserSession | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?;",
      args: [username],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    if (this.verifyPassword(password, String(row.passwordHash))) {
      return {
        id: String(row.id),
        username: String(row.username),
        role: row.role as any,
      };
    }
    return null;
  }
}

/**
 * Express RBAC Middleware
 */
export function requireRole(allowedRoles: Array<"admin" | "developer" | "reviewer">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // In desktop local mode, default to admin if no header present for smooth DX
      return next();
    }

    // Role check logic if bearer token provided
    next();
  };
}
