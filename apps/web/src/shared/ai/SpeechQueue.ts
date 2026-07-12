export interface SpeechQueueItem {
  text: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  timestamp: number;
}

export class SpeechQueue {
  private queue: SpeechQueueItem[] = [];

  public enqueue(text: string, priority: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL') {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.queue.push({
      text: trimmed,
      priority,
      timestamp: Date.now()
    });

    // Sort queue: HIGH priority first, then NORMAL, then LOW.
    // If priority is same, preserve chronological order (FIFO)
    const priorityWeights = { HIGH: 3, NORMAL: 2, LOW: 1 };
    
    this.queue.sort((a, b) => {
      const weightA = priorityWeights[a.priority];
      const weightB = priorityWeights[b.priority];
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return a.timestamp - b.timestamp;
    });
  }

  public dequeue(): SpeechQueueItem | undefined {
    return this.queue.shift();
  }

  public get size(): number {
    return this.queue.length;
  }

  public clear() {
    this.queue = [];
  }

  public getItems(): SpeechQueueItem[] {
    return [...this.queue];
  }
}

export const speechQueue = new SpeechQueue();
export default speechQueue;
