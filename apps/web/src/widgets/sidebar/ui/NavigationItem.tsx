import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface NavigationItemProps {
  label: string
  icon: LucideIcon
  path: string
  isActive: boolean
}

export default function NavigationItem({ label, icon: Icon, path, isActive }: NavigationItemProps) {
  return (
    <Link
      to={path}
      className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider transition-colors duration-300 relative group font-mono ${
        isActive ? 'text-[#FF0055]' : 'text-white/60 hover:text-white'
      }`}
    >
      {/* Active Navigation Pill */}
      {isActive && (
        <motion.div
          layoutId="activeSidebarPill"
          className="absolute inset-0 bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-lg -z-10 shadow-[0_0_12px_rgba(255,0,85,0.05)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Hover Background Capsule */}
      {!isActive && (
        <motion.div
          className="absolute inset-0 bg-white/5 rounded-lg -z-10"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}

      {/* Slide indicator dot on right side of active pill */}
      {isActive && (
        <motion.div
          layoutId="activeRightDot"
          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#FF0055]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      <Icon
        size={15}
        className={`transition-colors duration-300 ${
          isActive ? 'text-[#FF0055]' : 'text-white/40 group-hover:text-white'
        }`}
      />

      <span className="capitalize">{label}</span>
    </Link>
  )
}
