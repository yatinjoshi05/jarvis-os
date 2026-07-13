import { SearchProviderType } from './types';

export const BROWSER_CONFIG = {
  defaultSearchProvider: 'google' as SearchProviderType,
  navigationTimeoutMs: 15000,
  defaultUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JARVIS-OS/AI-Agent/1.0',
  maxHistoryEntries: 200,
  
  permissions: [
    'https://github.com',
    'https://google.com',
    'https://stackoverflow.com',
    'https://wikipedia.org',
    'https://npmjs.com'
  ],

  // Pre-seeded website content database for high-fidelity browser navigation simulation
  mockWebpages: {
    'https://google.com': {
      title: 'Google',
      html: '<html><body><h1>Google Search</h1><form action="/search"><input name="q" type="text"/></form></body></html>',
      textContent: 'Google Search Box Submit Form',
      links: [{ text: 'About', href: '/about' }, { text: 'Terms', href: '/terms' }]
    },
    'https://github.com': {
      title: 'GitHub: Let’s build from here',
      html: '<html><body><h1>GitHub</h1><a href="/login">Sign In</a><a href="/explore">Explore</a></body></html>',
      textContent: 'GitHub repository hosting service and developer community platform.',
      links: [{ text: 'Sign In', href: '/login' }, { text: 'Explore', href: '/explore' }]
    },
    'https://stackoverflow.com': {
      title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
      html: '<html><body><h1>Stack Overflow</h1><div class="q">How to deploy an AI agent?</div></body></html>',
      textContent: 'Stack Overflow Question Community Portal.',
      links: [{ text: 'Questions', href: '/questions' }, { text: 'Jobs', href: '/jobs' }]
    }
  } as Record<string, { title: string; html: string; textContent: string; links: { text: string; href: string }[] }>
};

export default BROWSER_CONFIG;
