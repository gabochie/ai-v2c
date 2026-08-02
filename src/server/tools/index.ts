import { execFile } from "child_process";
import { promisify } from "util";
import { FilesystemManager } from "../fs";
import { OpenClawClient } from "../openclaw/client";

const execFileAsync = promisify(execFile);

export class ToolRegistry {
  private static ALLOWED_COMMANDS = ["wp", "php", "git", "npm", "bun", "composer", "ls", "mkdir", "echo", "tsc"];

  /**
   * Execute an allowlisted CLI command safely inside the workspace directory.
   * Uses execFile with shell:false so no shell metacharacters can be injected.
   */
  public static async runCommand(commandLine: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const parts = commandLine.trim().split(/\s+/).filter(Boolean);
    const baseCommand = parts[0];

    if (!baseCommand || !this.ALLOWED_COMMANDS.includes(baseCommand)) {
      throw new Error(`Security Exception: Command '${baseCommand}' is not in the desktop allowlist (${this.ALLOWED_COMMANDS.join(", ")}).`);
    }

    const cwd = FilesystemManager.getWorkspaceRoot();

    try {
      const { stdout, stderr } = await execFileAsync(baseCommand, parts.slice(1), { cwd, timeout: 30000 });
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
   * Execute a command inside the OpenClaw sandboxed agent (network-isolated,
   * dropped capabilities). Returns raw stdout/stderr. Only available when the
   * OpenClaw gateway is configured.
   */
  public static async runCommandSandboxed(commandLine: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!OpenClawClient.isConfigured()) {
      return { stdout: "", stderr: "OpenClaw gateway not configured (OPENCLAW_GATEWAY_URL/TOKEN).", exitCode: 1 };
    }
    return OpenClawClient.runSandboxedCommand(commandLine);
  }

  /**
   * Perform PHP Syntax Validation check (php -l)
   */
  public static async validatePhpSyntax(filePath: string): Promise<{ valid: boolean; output: string }> {
    try {
      const safePath = FilesystemManager.resolveSafePath(filePath);
      const { stdout, stderr } = await execFileAsync("php", ["-l", safePath], { timeout: 30000 });
      const valid = stdout.toLowerCase().includes("no syntax errors detected");
      return { valid, output: stdout || stderr };
    } catch (err: any) {
      return {
        valid: false,
        output: err.stderr || err.message || "PHP binary not found or execution failed.",
      };
    }
  }

  /**
   * Execute Git Commit (two-step, shell-free)
   */
  public static async gitCommit(message: string): Promise<string> {
    const cwd = FilesystemManager.getWorkspaceRoot();
    try {
      await execFileAsync("git", ["add", "."], { cwd, timeout: 30000 });
      const { stdout, stderr } = await execFileAsync("git", ["commit", "-m", message], { cwd, timeout: 30000 });
      return stdout || stderr;
    } catch (err: any) {
      return err.stdout || err.stderr || err.message;
    }
  }
}
