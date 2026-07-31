import { exec } from "child_process";
import { promisify } from "util";
import { FilesystemManager } from "../fs";

const execAsync = promisify(exec);

export class ToolRegistry {
  private static ALLOWED_COMMANDS = ["wp", "php", "git", "npm", "bun", "composer", "ls", "mkdir", "echo", "tsc"];

  /**
   * Execute an allowlisted CLI command safely inside the workspace directory
   */
  public static async runCommand(commandLine: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const trimmed = commandLine.trim();
    const baseCommand = trimmed.split(" ")[0];

    if (!this.ALLOWED_COMMANDS.includes(baseCommand)) {
      throw new Error(`Security Exception: Command '${baseCommand}' is not in the desktop allowlist (${this.ALLOWED_COMMANDS.join(", ")}).`);
    }

    const cwd = FilesystemManager.getWorkspaceRoot();

    try {
      const { stdout, stderr } = await execAsync(trimmed, { cwd, timeout: 30000 });
      return { stdout, stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message || "Command execution error",
        exitCode: err.code || 1,
      };
    }
  }

  /**
   * Perform PHP Syntax Validation check (php -l)
   */
  public static async validatePhpSyntax(filePath: string): Promise<{ valid: boolean; output: string }> {
    try {
      const safePath = FilesystemManager.resolveSafePath(filePath);
      const { stdout, stderr, exitCode } = await this.runCommand(`php -l "${safePath}"`);
      const valid = exitCode === 0 && stdout.toLowerCase().includes("no syntax errors detected");
      return { valid, output: stdout || stderr };
    } catch (err: any) {
      return { valid: false, output: err.message || "PHP binary not found or execution failed." };
    }
  }

  /**
   * Execute Git Commit
   */
  public static async gitCommit(message: string): Promise<string> {
    const safeMsg = message.replace(/"/g, '\\"');
    const { stdout, stderr } = await this.runCommand(`git add . && git commit -m "${safeMsg}"`);
    return stdout || stderr;
  }
}
