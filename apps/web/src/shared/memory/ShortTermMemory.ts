import { Conversation, MemoryRecord } from './interfaces';
import { memoryRouter } from './MemoryRouter';
import { MemoryCompression } from './MemoryCompression';

class ShortTermMemory {
  private activeConversationId = 'default_conversation';

  public async getActiveConversation(): Promise<Conversation> {
    return this.getConversation(this.activeConversationId);
  }

  public async getConversation(id: string): Promise<Conversation> {
    const provider = memoryRouter.getProvider('transient');
    const record = await provider.load(id);
    if (record) {
      return record.value as Conversation;
    }

    return {
      id,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  public async saveConversation(conversation: Conversation): Promise<void> {
    const provider = memoryRouter.getProvider('transient');
    const processedMessages = await MemoryCompression.compress(conversation.messages);
    conversation.messages = processedMessages;
    conversation.updatedAt = Date.now();

    const record: MemoryRecord = {
      id: conversation.id,
      key: `conversation_${conversation.id}`,
      scope: 'transient',
      category: 'conversation',
      value: conversation,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    await provider.save(record);
  }

  public async appendMessage(role: 'system' | 'user' | 'assistant', content: string): Promise<Conversation> {
    const conversation = await this.getActiveConversation();
    conversation.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });
    
    await this.saveConversation(conversation);
    return conversation;
  }

  public async clearActive() {
    const provider = memoryRouter.getProvider('transient');
    await provider.delete(this.activeConversationId);
  }

  public setActiveConversationId(id: string) {
    this.activeConversationId = id;
  }

  public getActiveConversationId(): string {
    return this.activeConversationId;
  }
}

export const shortTermMemory = new ShortTermMemory();
export default shortTermMemory;
