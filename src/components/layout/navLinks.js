import { BarChart3, Gamepad2, History, LayoutDashboard, Settings } from 'lucide-react'

export const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]
