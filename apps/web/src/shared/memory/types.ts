export type MemoryScope = 'transient' | 'persistent' | 'working';

export type MemoryCategory =
  | 'conversation'
  | 'fact'
  | 'preference'
  | 'project'
  | 'task'
  | 'relationship'
  | 'goal'
  | 'profile'
  | 'reasoning';
