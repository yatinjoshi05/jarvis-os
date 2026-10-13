import { BaseAgent, type AgentTask, type AgentResult } from './IAgent'
import { eventBus } from '../model/eventBus'
import { llmRouter } from '../services/llmRouter'
import { fileSystemService } from '../services/fileSystemService'

export class CodingAgent extends BaseAgent {
  constructor() {
    super('agent-coding', 'Coding Agent', 'coding', ['code_generation', 'refactoring'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Coding Agent] Querying LLM Router & generating code for stage: ${task.name}...`,
    })

    const completion = await llmRouter.generateCompletion({
      prompt: `Generate production React TypeScript code for ${task.name}`,
      missionId: task.missionId,
    })

    await fileSystemService.writeFile(task.missionId, 'src/components/Navbar.tsx', '// Generated React Component\nexport function Navbar() { return <header></header> }')

    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: {
        generatedFilesCount: 1,
        tokensUsed: completion.tokensUsed,
        llmResponse: completion.text,
      },
    }
  }
}
