import fs from "fs";
import path from "path";

export class FilesystemManager {
  private static workspaceRoot = path.resolve(process.cwd(), "workspace");

  public static getWorkspaceRoot(): string {
    if (!fs.existsSync(this.workspaceRoot)) {
      fs.mkdirSync(this.workspaceRoot, { recursive: true });
    }
    return this.workspaceRoot;
  }

  /**
   * Set target root (e.g. LocalWP wp-content directory)
   */
  public static setWorkspaceRoot(newPath: string): void {
    const resolved = path.resolve(newPath);
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
    this.workspaceRoot = resolved;
  }

  /**
   * Validate that a target path is strictly inside the allowed workspace root.
   *
   * Defense layers:
   * 1. Segment-aware containment via `path.relative` — rejects `..` escapes AND
   *    sibling-prefix bypasses (`workspace-evil/...`), which a bare `startsWith`
   *    check allowed.
   * 2. Symlink escape defense — the nearest existing ancestor is `realpath`'d and
   *    must also stay inside the real workspace root.
   * 3. Case/drive normalization — the realpath of the workspace root is the
   *    comparison base, so Windows casing and `\\?\` prefixes cannot be abused.
   */
  public static resolveSafePath(targetPath: string): string {
    const root = this.getWorkspaceRoot();
    const rootReal = fs.realpathSync(root);
    const resolved = path.resolve(root, targetPath);

    const relative = path.relative(rootReal, resolved);
    const escaped = relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
    if (escaped) {
      throw new Error(`Security Violation: Path '${targetPath}' attempts to escape workspace boundary.`);
    }

    // Symlink escape defense: walk up to the nearest existing ancestor and verify
    // its real location is still inside the workspace root.
    let probe = resolved;
    while (!fs.existsSync(probe)) {
      const parent = path.dirname(probe);
      if (parent === probe) break;
      probe = parent;
    }
    if (fs.existsSync(probe)) {
      const probeReal = fs.realpathSync(probe);
      const relReal = path.relative(rootReal, probeReal);
      const realEscaped = relReal === ".." || relReal.startsWith(`..${path.sep}`) || path.isAbsolute(relReal);
      if (realEscaped) {
        throw new Error(`Security Violation: Path '${targetPath}' resolves outside workspace boundary via symlink.`);
      }
    }

    return resolved;
  }

  public static listDirectory(subPath: string = ""): Array<{ name: string; path: string; type: 'file' | 'folder'; size?: string }> {
    const safePath = this.resolveSafePath(subPath);
    if (!fs.existsSync(safePath)) {
      return [];
    }

    const items = fs.readdirSync(safePath, { withFileTypes: true });
    const root = this.getWorkspaceRoot();

    return items
      .filter((item) => !item.name.startsWith("."))
      .map((item) => {
        const fullPath = path.join(safePath, item.name);
        const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");
        const isDirectory = item.isDirectory();

        let size: string | undefined;
        if (!isDirectory) {
          try {
            const stats = fs.statSync(fullPath);
            size = `${(stats.size / 1024).toFixed(1)} KB`;
          } catch (e) {
            size = "0 KB";
          }
        }

        return {
          name: item.name,
          path: relativePath,
          type: isDirectory ? ("folder" as const) : ("file" as const),
          size,
        };
      });
  }

  public static readFile(subPath: string): string {
    const safePath = this.resolveSafePath(subPath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File '${subPath}' not found on workspace disk.`);
    }
    return fs.readFileSync(safePath, "utf-8");
  }

  public static writeFile(subPath: string, content: string): void {
    const safePath = this.resolveSafePath(subPath);
    const parentDir = path.dirname(safePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(safePath, content, "utf-8");
  }

  public static deleteFile(subPath: string): void {
    const safePath = this.resolveSafePath(subPath);
    if (fs.existsSync(safePath)) {
      const stat = fs.statSync(safePath);
      if (stat.isDirectory()) {
        fs.rmSync(safePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(safePath);
      }
    }
  }
}
