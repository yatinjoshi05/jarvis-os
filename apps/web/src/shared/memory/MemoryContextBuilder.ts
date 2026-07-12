import { shortTermMemory } from './ShortTermMemory';
import { workingMemory } from './WorkingMemory';
import { MemorySearch } from './MemorySearch';
import { MemoryUtils } from './utils';

export class MemoryContextBuilder {
  /**
   * Compiles the memory context into a prompt-ready context string.
   */
  public static async buildContext(userPrompt?: string): Promise<string> {
    let contextStr = '=== CONTEXTUAL AI MEMORY ===\n\n';

    // 1. Working Memory (Objectives & Current Task)
    const objective = workingMemory.getObjective();
    const tasks = workingMemory.getTasks();
    if (objective) {
      contextStr += `Current Goal/Objective: ${objective}\n`;
    }
    if (tasks.length > 0) {
      contextStr += `Current Task Checklist:\n${tasks.map((t) => `- [ ] ${t}`).join('\n')}\n\n`;
    }

    // 2. Short Term Memory (Active Conversation History)
    const conversation = await shortTermMemory.getActiveConversation();
    if (conversation.messages.length > 0) {
      const summaryMsg = conversation.messages.find((m) => m.role === 'system' && m.content.startsWith('[Archived Summary]:'));
      if (summaryMsg) {
        contextStr += `Archived Conversation Context:\n${summaryMsg.content}\n\n`;
      }
    }

    // 3. Long Term Memory (Relevant facts based on search)
    let searchTerms = userPrompt || '';
    if (!searchTerms && conversation.messages.length > 0) {
      const lastUserMsg = [...conversation.messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) searchTerms = lastUserMsg.content;
    }

    if (searchTerms) {
      const relevantRecords = await MemorySearch.query(searchTerms, { scope: 'persistent' });
      if (relevantRecords.length > 0) {
        contextStr += `Relevant User Facts & Preferences:\n`;
        relevantRecords.slice(0, 5).forEach((result) => {
          const val = typeof result.record.value === 'string'
            ? result.record.value
            : MemoryUtils.safeStringify(result.record.value);
          contextStr += `- [${result.record.key}]: ${val}\n`;
        });
        contextStr += `\n`;
      }
    }

    return contextStr.trim();
  }
}
export default MemoryContextBuilder;
