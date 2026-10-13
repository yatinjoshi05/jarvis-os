// ─────────────────────────────────────────────
// JARVIS OS — Memory Seeds
// Realistic first-run data — relative timestamps
// ─────────────────────────────────────────────

import { MemoryEntry } from './types'
import { generateMemoryId } from './utils'

const now = Date.now()
const h = 3_600_000     // 1 hour in ms
const d = 86_400_000    // 1 day in ms

export function createSeeds(): MemoryEntry[] {
  return [
    {
      id: generateMemoryId(),
      title: 'React Login Page Mission',
      summary:
        'You asked me to build a modern React login page using TypeScript and Tailwind CSS.',
      content:
        'Full implementation including email/password validation, error states, loading spinner, and JWT integration. Deployed to /auth/login route. Uses the global JARVIS design system tokens.',
      type: 'mission',
      tags: ['React', 'TypeScript', 'Tailwind', 'Auth'],
      pinned: false,
      archived: false,
      favourite: true,
      source: 'Mission Engine',
      relatedMemoryIds: [],
      metadata: { importance: 8, confidence: 1.0, missionId: 'mission-001' },
      author: 'jarvis',
      version: 1,
      createdAt: now - 1.5 * h,
      updatedAt: now - 1.5 * h,
      lastAccessed: now - 0.5 * h,
    },
    {
      id: generateMemoryId(),
      title: 'Financial Operating System',
      summary:
        'Discussed features: goals, SIP, insurance, portfolio, risk profiling, and CRM integration.',
      content:
        'Comprehensive financial module design session. Agreed on multi-account support, real-time portfolio sync, SIP calculator with visual projections, and insurance coverage tracker.',
      type: 'knowledge',
      tags: ['Investment', 'Financial Planning', 'SIP', 'Insurance'],
      pinned: true,
      archived: false,
      favourite: false,
      source: 'Chat',
      relatedMemoryIds: [],
      metadata: { importance: 9, confidence: 0.95 },
      author: 'jarvis',
      version: 1,
      createdAt: now - 3 * h,
      updatedAt: now - 3 * h,
      lastAccessed: now - 1 * h,
    },
    {
      id: generateMemoryId(),
      title: 'Client Meeting Notes',
      summary:
        'Notes from meeting with Client ABC regarding investment strategy and portfolio rebalancing.',
      content:
        'Client ABC (high-net-worth individual) — discussed shift from equity-heavy to balanced 60/40 portfolio. Target return: 12% CAGR over 5 years. Risk appetite: moderate. Follow up: prepare proposal by end of week.',
      type: 'conversation',
      tags: ['CRM', 'Client', 'Investment'],
      pinned: false,
      archived: false,
      favourite: false,
      source: 'Chat',
      relatedMemoryIds: [],
      metadata: { importance: 7, confidence: 0.9 },
      author: 'user',
      version: 1,
      createdAt: now - 1 * d - 2 * h,
      updatedAt: now - 1 * d - 2 * h,
      lastAccessed: now - 1 * d,
    },
    {
      id: generateMemoryId(),
      title: 'Dashboard.tsx Implementation',
      summary: '/projects/jarvis-os/src/components/Dashboard.tsx',
      content:
        'Main dashboard component. Uses React 18 with Suspense boundaries. Custom hook useMetrics() for real-time data. CSS Grid layout with 12-column system. Lazy loads chart modules.',
      type: 'file',
      tags: ['Dashboard', 'React', 'Component'],
      pinned: false,
      archived: false,
      favourite: false,
      source: 'File System',
      relatedMemoryIds: [],
      metadata: {
        importance: 6,
        confidence: 1.0,
        filePath: '/projects/jarvis-os/src/components/Dashboard.tsx',
      },
      author: 'jarvis',
      version: 1,
      createdAt: now - 1 * d - 5 * h,
      updatedAt: now - 1 * d - 5 * h,
      lastAccessed: now - 12 * h,
    },
    {
      id: generateMemoryId(),
      title: 'Pref: Communication Style',
      summary: 'You prefer short, clear, and actionable responses.',
      content:
        'User prefers: concise bullet points over paragraphs, code examples over theory, direct recommendations over options. Avoid preamble. Skip pleasantries. Show the answer first, reasoning second.',
      type: 'preference',
      tags: ['Automation', 'Preferences', 'UX'],
      pinned: true,
      archived: false,
      favourite: false,
      source: 'System',
      relatedMemoryIds: [],
      metadata: { importance: 10, confidence: 1.0 },
      author: 'system',
      version: 1,
      createdAt: now - 2 * d - 3 * h,
      updatedAt: now - 2 * d - 3 * h,
      lastAccessed: now - 30 * 60 * 1000,
    },
    {
      id: generateMemoryId(),
      title: 'JARVIS OS Architecture Decision',
      summary:
        'Agreed to use Feature-Sliced Design with Zustand 5 for state management.',
      content:
        'Architecture: Feature-Sliced Design layers (app → pages → widgets → features → entities → shared). State: Zustand 5 with custom persistence. Styling: Tailwind 3 with custom design tokens. Build: Vite 5. No class-based components.',
      type: 'knowledge',
      tags: ['Architecture', 'Automation', 'React'],
      pinned: true,
      archived: false,
      favourite: true,
      source: 'Chat',
      relatedMemoryIds: [],
      metadata: { importance: 10, confidence: 1.0 },
      author: 'jarvis',
      version: 1,
      createdAt: now - 5 * d,
      updatedAt: now - 5 * d,
      lastAccessed: now - 2 * d,
    },
    {
      id: generateMemoryId(),
      title: 'CRM Module — Lead Pipeline Design',
      summary:
        'Kanban-style lead pipeline with 6 stages: New → Qualified → Proposal → Negotiation → Won → Lost.',
      content:
        'Pipeline stages defined. Drag-and-drop between stages. Auto-notify on stage change. Integration with WhatsApp and email. Priority scoring: deal size × close probability. Target: 200 leads per page.',
      type: 'project',
      tags: ['CRM', 'Dashboard'],
      pinned: false,
      archived: false,
      favourite: false,
      source: 'Mission Engine',
      relatedMemoryIds: [],
      metadata: { importance: 7, confidence: 0.85, projectId: 'crm-module' },
      author: 'jarvis',
      version: 1,
      createdAt: now - 7 * d,
      updatedAt: now - 7 * d,
      lastAccessed: now - 3 * d,
    },
  ]
}
