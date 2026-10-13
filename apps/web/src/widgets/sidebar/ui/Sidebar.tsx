import SidebarNavigation from './SidebarNavigation'
import SidebarFooter from './SidebarFooter'

export default function Sidebar() {
  return (
    <aside className="w-full bg-black border-r border-white/10 h-full flex flex-col justify-between py-5 select-none font-mono flex-shrink-0">
      {/* 1. Navigation items list */}
      <SidebarNavigation />

      {/* 2. Profile card */}
      <SidebarFooter />
    </aside>
  )
}
