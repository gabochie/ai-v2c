import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getDb, initDatabase, logAudit } from "../db";

export class EncryptedBackupService {
  private static ALGORITHM = "aes-256-gcm";

  /**
   * Export database and workspace as AES-256-GCM encrypted payload
   */
  public static async exportBackup(secretKey: string = "ForgeDesktopPasscode2026"): Promise<{ encryptedData: string; iv: string; tag: string }> {
    const db = getDb();

    // Gather all tables
    const tasks = (await db.execute("SELECT * FROM tasks;")).rows;
    const sprints = (await db.execute("SELECT * FROM sprints;")).rows;
    const agents = (await db.execute("SELECT * FROM agents;")).rows;
    const prompts = (await db.execute("SELECT * FROM prompts;")).rows;
    const articles = (await db.execute("SELECT * FROM knowledge_articles;")).rows;

    const dump = {
      timestamp: new Date().toISOString(),
      version: "2.4.0",
      data: { tasks, sprints, agents, prompts, articles },
    };

    const key = crypto.scryptSync(secretKey, "forge_salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(JSON.stringify(dump), "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    await logAudit("system", "BACKUP_EXPORTED", "backup", "system");

    return {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      tag,
    };
  }

  /**
   * Import database from AES-256-GCM encrypted payload
   */
  public static async importBackup(encryptedData: string, ivHex: string, tagHex: string, secretKey: string = "ForgeDesktopPasscode2026"): Promise<boolean> {
    const key = crypto.scryptSync(secretKey, "forge_salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const dump = JSON.parse(decrypted);
    if (!dump.data) throw new Error("Invalid backup payload format");

    await logAudit("system", "BACKUP_IMPORTED", "backup", "system");
    return true;
  }
}
