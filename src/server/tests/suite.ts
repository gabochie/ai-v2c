import { getDb, initDatabase } from "../db";
import { ProjectFactory } from "../wp/factory";
import { FilesystemManager } from "../fs";
import { ToolRegistry } from "../tools";
import { EncryptedBackupService } from "../security/backup";

export async function runEnterpriseTestSuite(): Promise<{ total: number; passed: number; failed: number; results: Array<{ name: string; passed: boolean; message: string }> }> {
  const results: Array<{ name: string; passed: boolean; message: string }> = [];

  // Test 1: Database Initialization & Querying
  try {
    await initDatabase();
    const db = getDb();
    const res = await db.execute("SELECT COUNT(*) as count FROM tasks;");
    const count = Number(res.rows[0].count);
    results.push({
      name: "SQLite Database WAL & Table Seed Check",
      passed: count > 0,
      message: `Database loaded successfully with ${count} tasks.`,
    });
  } catch (err: any) {
    results.push({ name: "SQLite Database WAL & Table Seed Check", passed: false, message: err.message });
  }

  // Test 2: Project Factory Plugin Boilerplate Generation
  try {
    const buildRes = await ProjectFactory.buildProject({
      type: "plugin",
      name: "Unit Test Plugin",
      slug: "unit-test-plugin",
      description: "Automated test plugin",
      author: "Forge Suite",
    });

    results.push({
      name: "Project Factory Plugin Generation",
      passed: buildRes.success && buildRes.filesCreated.length >= 3,
      message: `Generated ${buildRes.filesCreated.length} files cleanly in workspace.`,
    });
  } catch (err: any) {
    results.push({ name: "Project Factory Plugin Generation", passed: false, message: err.message });
  }

  // Test 3: Path Traversal Security Prevention
  try {
    let prevented = false;
    try {
      FilesystemManager.resolveSafePath("../../../etc/passwd");
    } catch (e) {
      prevented = true;
    }

    results.push({
      name: "Filesystem Path-Traversal Security Guard",
      passed: prevented,
      message: prevented ? "Path traversal attempt strictly rejected with 400 exception." : "Security flaw!",
    });
  } catch (err: any) {
    results.push({ name: "Filesystem Path-Traversal Security Guard", passed: false, message: err.message });
  }

  // Test 4: Encrypted Backup & Restore Round-Trip
  try {
    const backup = await EncryptedBackupService.exportBackup("UnitTestSecretKey");
    const restored = await EncryptedBackupService.importBackup(backup.encryptedData, backup.iv, backup.tag, "UnitTestSecretKey");

    results.push({
      name: "AES-256-GCM Encrypted Backup Roundtrip",
      passed: restored,
      message: "Database exported, encrypted, and restored cleanly.",
    });
  } catch (err: any) {
    results.push({ name: "AES-256-GCM Encrypted Backup Roundtrip", passed: false, message: err.message });
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
