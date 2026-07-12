import { Message } from './interfaces';
import { MEMORY_CONFIG } from './config';
import { memoryLogger } from './Logger';
import { memoryEventEmitter, MemoryEvents } from './events';

export class MemoryCompression {
  private static summarizerCallback?: (text: string) => Promise<string>;

  public static registerSummarizer(callback: (text: string) => Promise<string>) {
    this.summarizerCallback = callback;
  }

  /**
   * Compresses conversation messages when limits are exceeded.
   */
  public static async compress(messages: Message[]): Promise<Message[]> {
    const trigger = MEMORY_CONFIG.compression.triggerLength;
    const target = MEMORY_CONFIG.compression.targetLength;

    if (messages.length <= trigger) {
      return messages;
    }

    memoryLogger.info('Compression', `Compressing conversation from ${messages.length} messages...`);

    // Slice messages to compress (e.g. all except the newest 'target' messages)
    const compressCount = messages.length - target;
    const toCompress = messages.slice(0, compressCount);
    const remainder = messages.slice(compressCount);

    const formattedHistory = toCompress
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    let summaryText = 'Key details from earlier conversations preserved.';

    if (this.summarizerCallback) {
      try {
        summaryText = await this.summarizerCallback(formattedHistory);
      } catch (e) {
        memoryLogger.error('Compression', 'LLM summarization failed, using fallback summary', e);
      }
    } else {
      // Fallback simple summary heuristic
      const topics = toCompress
        .filter((m) => m.role === 'user')
        .map((m) => m.content.substring(0, 30))
        .join(', ');
      summaryText = `[Auto-Summary] Discussion topics included: ${topics}...`;
    }

    const summaryMessage: Message = {
      role: 'system',
      content: `[Archived Summary]: ${summaryText}`,
      timestamp: Date.now()
    };

    const compressed = [summaryMessage, ...remainder];
    
    memoryLogger.info('Compression', `Compression complete. New message count: ${compressed.length}`);
    memoryEventEmitter.emit(MemoryEvents.MEMORY_COMPRESSED, { before: messages.length, after: compressed.length });

    return compressed;
  }
}
export default MemoryCompression;
