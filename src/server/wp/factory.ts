import { WpTemplates, ScaffoldParams } from "../templates";
import { FilesystemManager } from "../fs";
import { ToolRegistry } from "../tools";

export interface ProjectFactoryRequest extends ScaffoldParams {
  type: 'plugin' | 'block' | 'rest_api' | 'admin_settings' | 'woo_extension' | 'theme';
}

export interface ProjectFactoryResult {
  success: boolean;
  type: string;
  targetDir: string;
  filesCreated: string[];
  validationResults: Array<{ file: string; valid: boolean; output: string }>;
  message: string;
}

export class ProjectFactory {
  public static async buildProject(req: ProjectFactoryRequest): Promise<ProjectFactoryResult> {
    let filesMap: Record<string, string> = {};

    switch (req.type) {
      case 'plugin':
        filesMap = WpTemplates.pluginBoilerplate(req);
        break;
      case 'block':
        filesMap = WpTemplates.gutenbergBlock(req);
        break;
      case 'rest_api':
        filesMap = WpTemplates.restController(req);
        break;
      case 'admin_settings':
        filesMap = WpTemplates.adminSettingsPage(req);
        break;
      case 'woo_extension':
        filesMap = WpTemplates.wooCommerceExtension(req);
        break;
      case 'theme':
        filesMap = WpTemplates.themeScaffold(req);
        break;
      default:
        filesMap = WpTemplates.pluginBoilerplate(req);
    }

    const filesCreated: string[] = [];
    const validationResults: Array<{ file: string; valid: boolean; output: string }> = [];

    // Write generated files to workspace
    for (const [relPath, content] of Object.entries(filesMap)) {
      FilesystemManager.writeFile(relPath, content);
      filesCreated.push(relPath);

      // Validate PHP syntax if PHP file
      if (relPath.endsWith('.php')) {
        const val = await ToolRegistry.validatePhpSyntax(relPath);
        validationResults.push({
          file: relPath,
          valid: val.valid,
          output: val.output,
        });
      }
    }

    const hasErrors = validationResults.some((v) => !v.valid);

    return {
      success: !hasErrors,
      type: req.type,
      targetDir: FilesystemManager.getWorkspaceRoot(),
      filesCreated,
      validationResults,
      message: hasErrors
        ? `Project generated with ${validationResults.filter(v => !v.valid).length} syntax warnings.`
        : `Successfully generated and validated ${req.name} (${req.type}) in workspace!`,
    };
  }
}
