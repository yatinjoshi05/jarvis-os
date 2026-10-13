/**
 * Public API for the terminal module.
 */
export * from './types';
export * from './interfaces';
export * from './constants';
export * from './events';
export * from './errors';

export * from './model/useTerminalStore';
export * from './services/TerminalService';

export { default as TerminalPage } from './ui/TerminalPage';
export * from './ui/TerminalPage';
export * from './ui/TerminalToolbar';
export * from './ui/TerminalTabs';
export * from './ui/TerminalWindow';
export * from './ui/TerminalLine';
export * from './ui/CommandHistoryPanel';
export * from './ui/AISuggestionPanel';
export * from './ui/TerminalInput';
export * from './ui/TerminalStatusBar';
export * from './ui/TerminalSettings';
