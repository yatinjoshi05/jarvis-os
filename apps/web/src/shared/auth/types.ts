export type UserRole = 'admin' | 'owner' | 'member' | 'guest' | 'agent' | 'plugin';

export type Permission =
  | 'read:all'
  | 'write:all'
  | 'execute:all'
  | 'plugin:install'
  | 'api:rotate'
  | 'admin:write'
  | 'settings:write'
  | 'chat:send';
