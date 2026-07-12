import { ExecutionContext } from './interfaces';

export class AgentContext {
  /**
   * Helper builder to compile execution contexts.
   */
  public static build(
    userId: string,
    conversationId: string,
    workspaceId = 'work_main',
    variables: Record<string, any> = {}
  ): ExecutionContext {
    return {
      userId,
      conversationId,
      workspaceId,
      variables
    };
  }
}
export default AgentContext;
