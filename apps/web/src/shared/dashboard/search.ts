import { widgetManager } from './widget';
import { sidebarManager } from './sidebar';
import { commandBarManager } from './command';

export interface SearchResult {
  id: string;
  type: 'widget' | 'module' | 'command';
  title: string;
  description: string;
  target: string; // Action, path, or execution string
}

class SearchManager {
  public search(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    const results: SearchResult[] = [];

    // 1. Search widgets
    const widgets = widgetManager.getWidgets();
    widgets.forEach((w) => {
      if (w.name.toLowerCase().includes(lowerQuery) || w.category.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: w.id,
          type: 'widget',
          title: w.name,
          description: `Widget in ${w.category}`,
          target: w.id
        });
      }
    });

    // 2. Search sidebar modules
    const modules = sidebarManager.getSidebarItems();
    modules.forEach((m) => {
      if (m.label.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: m.id,
          type: 'module',
          title: m.label,
          description: `Application module`,
          target: m.path
        });
      }
    });

    // 3. Search commands
    const commands = commandBarManager.getSuggestions(lowerQuery);
    commands.forEach((c) => {
      results.push({
        id: c.id,
        type: 'command',
        title: c.text,
        description: c.description,
        target: c.text
      });
    });

    return results;
  }
}

export const searchManager = new SearchManager();
export default searchManager;
