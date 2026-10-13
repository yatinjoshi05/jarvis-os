import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Home,
  MessageSquare,
  Compass,
  Brain,
  FolderOpen,
  Terminal,
  Globe,
  Code,
  TrendingUp,
  Network,
  Settings, Bot,
  LucideIcon,
  Users,
  LayoutDashboard,
  Youtube,
  Instagram,
  Facebook
} from 'lucide-react'

import NavigationItem from './NavigationItem'
import { sidebarSettings } from '../../../shared/theme/SidebarSettings'

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
}

const NAV_ITEMS_MAP: Record<string, NavItem> = {
  home: { id: 'home', label: 'Home', icon: Home, path: '/' },
  'mission-control': { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard, path: '/mission-control' },
  chat: { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  missions: { id: 'missions', label: 'Missions', icon: Compass, path: '/missions' },
  memory: { id: 'memory', label: 'Memory', icon: Brain, path: '/memory' },
  files: { id: 'files', label: 'Files', icon: FolderOpen, path: '/files' },
  terminal: { id: 'terminal', label: 'Terminal', icon: Terminal, path: '/terminal' },
  browser: { id: 'browser', label: 'Browser', icon: Globe, path: '/browser' },
  coding: { id: 'coding', label: 'Coding', icon: Code, path: '/coding' },
  trading: { id: 'trading', label: 'Trading', icon: TrendingUp, path: '/trading' },
  crm: { id: 'crm', label: 'CRM OS', icon: Users, path: '/crm' },
  devices: { id: 'devices', label: 'Devices', icon: Network, path: '/devices' },
  'agent-hub': { id: 'agent-hub', label: 'Agent Hub', icon: Bot, path: '/agent-hub' },
  'yt-studio': { id: 'yt-studio', label: 'YT Studio', icon: Youtube, path: '/yt-studio' },
  instagram: { id: 'instagram', label: 'Instagram', icon: Instagram, path: '/instagram' },
  facebook: { id: 'facebook', label: 'Facebook', icon: Facebook, path: '/facebook' },
  settings: { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
}

export default function SidebarNavigation() {
  const location = useLocation()
  const currentPath = location.pathname
  const [sbState, setSbState] = useState(() => sidebarSettings.getState())

  useEffect(() => {
    const unsub = sidebarSettings.subscribe((state) => {
      setSbState(state)
    })
    return unsub
  }, [])

  const checkIsActive = (item: NavItem) => {
    if (item.path === '/') {
      return currentPath === '/'
    }
    return currentPath.startsWith(item.path)
  }

  // Derive ordered and visible items
  const allOrderedIds = [...sbState.itemOrder]
  Object.keys(NAV_ITEMS_MAP).forEach((id) => {
    if (!allOrderedIds.includes(id)) {
      const settingsIdx = allOrderedIds.indexOf('settings')
      if (settingsIdx !== -1) {
        allOrderedIds.splice(settingsIdx, 0, id)
      } else {
        allOrderedIds.push(id)
      }
    }
  })

  const visibleItems = allOrderedIds
    .map((id) => NAV_ITEMS_MAP[id])
    .filter((item): item is NavItem => Boolean(item) && !sbState.hiddenItems[item.id])

  return (
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto hide-scrollbar">
      {visibleItems.map((item) => (
        <NavigationItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          path={item.path}
          isActive={checkIsActive(item)}
        />
      ))}
    </nav>
  )
}
