import { eventBus } from './EventBus';

export type MemoryCategory =
  | 'conversations'
  | 'missions'
  | 'files'
  | 'websites'
  | 'notes'
  | 'decisions'
  | 'pinned memories';

export interface MemoryRecord {
  id: string;
  title: string;
  category: MemoryCategory;
  source: string;
  date: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
  pinned: boolean;
  content: string;
}

export class MemoryEngineService {
  private memories: MemoryRecord[] = [
    {
      id: 'mem-1',
      title: 'JARVIS Terminal Subsystem Architecture',
      category: 'conversations',
      source: 'Terminal Module Session',
      date: '2026-07-31',
      importance: 'HIGH',
      tags: ['terminal', 'workspace', 'split-pane'],
      pinned: true,
      content: 'Configured Zustand persistent workspace store for up to 20 terminal panes.',
    },
    {
      id: 'mem-2',
      title: 'Browser Module Phase 2C Preview Engine',
      category: 'missions',
      source: 'Browser Engine',
      date: '2026-07-31',
      importance: 'HIGH',
      tags: ['browser', 'tauri', 'flutter', 'react'],
      pinned: true,
      content: 'Implemented universal device frames (iPhone/Android/Tablet) and desktop app window preview.',
    },
    {
      id: 'mem-3',
      title: 'User Preferred Development Settings',
      category: 'notes',
      source: 'System Memory',
      date: '2026-07-30',
      importance: 'MEDIUM',
      tags: ['settings', 'windows', 'vite'],
      pinned: false,
      content: 'OS Windows 11, dev server port 5173, root directory d:/jarvis.',
    },
    {
      id: 'mem-4',
      title: 'AI Decision Rules & Control Flow',
      category: 'decisions',
      source: 'Supervisor Agent',
      date: '2026-07-29',
      importance: 'HIGH',
      tags: ['ai', 'rules', 'safety'],
      pinned: false,
      content: 'Never modify Phase 1 locked UI layout or colors without explicit user approval.',
    },
  ];

  public remember(record: Omit<MemoryRecord, 'id' | 'date'>): MemoryRecord {
    const newRecord: MemoryRecord = {
      ...record,
      id: `mem-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    this.memories.unshift(newRecord);
    eventBus.emit('memory updated', { action: 'remember', id: newRecord.id });
    return newRecord;
  }

  public forget(id: string): boolean {
    const prevLength = this.memories.length;
    this.memories = this.memories.filter((m) => m.id !== id);
    const deleted = this.memories.length < prevLength;

    if (deleted) {
      eventBus.emit('memory updated', { action: 'forget', id });
    }
    return deleted;
  }

  public search(query: string, category?: MemoryCategory): MemoryRecord[] {
    const q = query.toLowerCase().trim();
    return this.memories.filter((m) => {
      const matchCategory = !category || m.category === category;
      const matchQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategory && matchQuery;
    });
  }

  public pin(id: string, pinned: boolean = true): MemoryRecord | null {
    const memory = this.memories.find((m) => m.id === id);
    if (memory) {
      memory.pinned = pinned;
      eventBus.emit('memory updated', { action: 'pin', id, pinned });
      return memory;
    }
    return null;
  }

  public summarize(): { total: number; pinnedCount: number; categoriesCount: Record<string, number> } {
    const categoriesCount: Record<string, number> = {};
    let pinnedCount = 0;

    this.memories.forEach((m) => {
      if (m.pinned) pinnedCount++;
      categoriesCount[m.category] = (categoriesCount[m.category] || 0) + 1;
    });

    return {
      total: this.memories.length,
      pinnedCount,
      categoriesCount,
    };
  }

  public retrieve(id: string): MemoryRecord | null {
    return this.memories.find((m) => m.id === id) || null;
  }

  public getAllMemories(): MemoryRecord[] {
    return this.memories;
  }
}

export const memoryEngine = new MemoryEngineService();
