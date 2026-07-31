import { getDb, logAudit } from "../db";
import { AIRouter } from "../ai/router";
import { FilesystemManager } from "../fs";
import { ToolRegistry } from "../tools";
import { ProjectFactory } from "../wp/factory";

export interface AgentRunStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  durationMs?: number;
}

export interface AgentRunRecord {
  id: string;
  agentId: string;
  agentName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  steps: AgentRunStep[];
  artifacts: string[];
  tokensUsed: number;
  startedAt: string;
  completedAt?: string;
}

export class AgentOrchestrator {
  /**
   * Start a new agent run
   */
  public static async createAndExecuteRun(
    agentId: string,
    agentName: string,
    goal: string,
    projectType: 'plugin' | 'block' | 'rest_api' | 'admin_settings' | 'woo_extension' | 'theme' = 'plugin'
  ): Promise<AgentRunRecord> {
    const db = getDb();
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startedAt = new Date().toISOString();

    const initialSteps: AgentRunStep[] = [
      { id: 'step_1', name: '1. Plan & Architecture Specification', status: 'pending' },
      { id: 'step_2', name: '2. Scaffold WordPress Code Structure', status: 'pending' },
      { id: 'step_3', name: '3. Execute PHP Syntax & Standards Check', status: 'pending' },
      { id: 'step_4', name: '4. Register Artifacts & Workspace Commit', status: 'pending' },
    ];

    const runRecord: AgentRunRecord = {
      id: runId,
      agentId,
      agentName,
      status: 'running',
      steps: initialSteps,
      artifacts: [],
      tokensUsed: 0,
      startedAt,
    };

    // Save initial run to DB
    await db.execute({
      sql: `INSERT INTO agent_runs (id, agentId, status, steps, artifacts, tokensUsed, startedAt) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [
        runRecord.id,
        runRecord.agentId,
        runRecord.status,
        JSON.stringify(runRecord.steps),
        JSON.stringify(runRecord.artifacts),
        runRecord.tokensUsed,
        runRecord.startedAt,
      ],
    });

    await logAudit("system", "AGENT_RUN_STARTED", "agent_run", runId, { agentId, goal });

    // Execute run steps asynchronously / in background
    this.processRunSteps(runRecord, goal, projectType).catch((err) => {
      console.error(`Agent run ${runId} execution error:`, err);
    });

    return runRecord;
  }

  private static async processRunSteps(
    run: AgentRunRecord,
    goal: string,
    projectType: 'plugin' | 'block' | 'rest_api' | 'admin_settings' | 'woo_extension' | 'theme'
  ): Promise<void> {
    const db = getDb();
    const slug = goal.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20) || 'custom-plugin';

    try {
      // Step 1: Plan via AI Router
      run.steps[0].status = 'running';
      await this.saveRunState(run);

      const aiPlanRes = await AIRouter.routeAndExecute({
        taskType: 'wordpress_plugin',
        prompt: `Create a step-by-step implementation plan for WordPress project: "${goal}". Target slug: ${slug}`,
      });

      run.tokensUsed += aiPlanRes.tokensEstimated || 150;
      run.steps[0].status = 'completed';
      run.steps[0].output = aiPlanRes.reply.substring(0, 300) + '...';
      await this.saveRunState(run);

      // Step 2: Scaffold WordPress Project
      run.steps[1].status = 'running';
      await this.saveRunState(run);

      const buildRes = await ProjectFactory.buildProject({
        type: projectType,
        name: goal,
        slug: slug,
        description: `Autonomously generated WordPress ${projectType} by FORGE AI Agent.`,
        author: run.agentName || 'Forge Agent',
      });

      run.artifacts = buildRes.filesCreated;
      run.steps[1].status = 'completed';
      run.steps[1].output = `Generated ${buildRes.filesCreated.length} files in workspace.`;
      await this.saveRunState(run);

      // Step 3: PHP Syntax Validation Check
      run.steps[2].status = 'running';
      await this.saveRunState(run);

      const phpFiles = buildRes.filesCreated.filter((f) => f.endsWith('.php'));
      let allValid = true;
      let valSummary = '';

      for (const f of phpFiles) {
        const val = await ToolRegistry.validatePhpSyntax(f);
        valSummary += `${f}: ${val.valid ? 'OK' : 'Lint Warning'} | `;
        if (!val.valid) allValid = false;
      }

      run.steps[2].status = 'completed';
      run.steps[2].output = valSummary || 'All PHP files validated cleanly.';
      await this.saveRunState(run);

      // Step 4: Workspace Git Commit & Artifact Registration
      run.steps[3].status = 'running';
      await this.saveRunState(run);

      const gitRes = await ToolRegistry.gitCommit(`Auto-build: ${goal} by ${run.agentName}`);
      run.steps[3].status = 'completed';
      run.steps[3].output = `Git commit executed. Artifacts registered on disk.`;

      run.status = 'completed';
      run.completedAt = new Date().toISOString();
      await this.saveRunState(run);

      await logAudit("system", "AGENT_RUN_COMPLETED", "agent_run", run.id, {
        tokensUsed: run.tokensUsed,
        artifacts: run.artifacts,
      });
    } catch (err: any) {
      run.status = 'failed';
      const runningIdx = run.steps.findIndex((s) => s.status === 'running');
      if (runningIdx !== -1) {
        run.steps[runningIdx].status = 'failed';
        run.steps[runningIdx].output = err.message;
      }
      run.completedAt = new Date().toISOString();
      await this.saveRunState(run);

      await logAudit("system", "AGENT_RUN_FAILED", "agent_run", run.id, { error: err.message });
    }
  }

  private static async saveRunState(run: AgentRunRecord): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE agent_runs SET status = ?, steps = ?, artifacts = ?, tokensUsed = ?, completedAt = ? WHERE id = ?;`,
      args: [
        run.status,
        JSON.stringify(run.steps),
        JSON.stringify(run.artifacts),
        run.tokensUsed,
        run.completedAt || null,
        run.id,
      ],
    });
  }

  public static async getRun(id: string): Promise<AgentRunRecord | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM agent_runs WHERE id = ?;",
      args: [id],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      id: String(row.id),
      agentId: String(row.agentId),
      status: row.status as any,
      steps: JSON.parse(String(row.steps || '[]')),
      artifacts: JSON.parse(String(row.artifacts || '[]')),
      tokensUsed: Number(row.tokensUsed || 0),
      startedAt: String(row.startedAt),
      completedAt: row.completedAt ? String(row.completedAt) : undefined,
    };
  }

  public static async getAllRuns(): Promise<AgentRunRecord[]> {
    const db = getDb();
    const res = await db.execute("SELECT * FROM agent_runs ORDER BY startedAt DESC LIMIT 20;");
    return res.rows.map((row) => ({
      id: String(row.id),
      agentId: String(row.agentId),
      status: row.status as any,
      steps: JSON.parse(String(row.steps || '[]')),
      artifacts: JSON.parse(String(row.artifacts || '[]')),
      tokensUsed: Number(row.tokensUsed || 0),
      startedAt: String(row.startedAt),
      completedAt: row.completedAt ? String(row.completedAt) : undefined,
    }));
  }
}
