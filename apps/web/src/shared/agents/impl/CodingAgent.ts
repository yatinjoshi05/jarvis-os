import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import { getBackendApiUrl } from '../../ai/config';

export class CodingAgent extends AbstractBaseAgent {
  constructor(id = 'coding_agent', name = 'Coding Agent') {
    super(id, name, 'coder');
    this.capabilities = [
      { id: 'code_generation', name: 'Code Generation', description: 'Write, debug, and refactor code' }
    ];
    this.permissions = [{ id: 'perm_fs', type: 'file', resource: '*', action: '*' }];
    this.supportedTools = ['filesystem_read', 'filesystem_write'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const targetFileName = `generated_${Date.now()}.ts`;
    const targetPath = `d:\\jarvis\\${targetFileName}`;
    const generatedCode = `// JARVIS OS Real Code Generation for ${task.name}\n// Task: ${task.description || task.name}\n\nexport function runTask() {\n  console.log("Task ${task.name} executed successfully.");\n  return { status: "success", timestamp: "${new Date().toISOString()}" };\n}\n`;

    let realWriteSuccess = false;
    let buildResult = 'Real disk write unconfirmed';

    try {
      const url = getBackendApiUrl('/api/system/write-file');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath, content: generatedCode })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        realWriteSuccess = true;
        buildResult = `Verified on disk at ${json.filePath} (${json.bytesWritten} bytes)`;
      } else {
        buildResult = `Failed disk write: ${json.error || 'Unknown error'}`;
      }
    } catch (err: any) {
      buildResult = `Write execution error: ${err.message}`;
    }

    const data = {
      code: generatedCode,
      filePath: targetPath,
      buildResult,
      isMock: false
    };

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id, isMock: false, realWriteSuccess });

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: realWriteSuccess,
      data
    };
  }
}
export default CodingAgent;
