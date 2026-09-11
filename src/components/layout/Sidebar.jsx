import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { navLinks } from './navLinks'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/80 lg:flex">
      <div className="px-2 py-3">
        <p className="font-display text-xl font-bold tracking-tight">Gacha Daily</p>
        <p className="text-xs text-zinc-500">Keep the chain unbroken</p>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Primary">
        {navLinks.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <img
            src={profile?.photoURL || '/favicon.svg'}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.displayName || 'Player'}</p>
            <p className="truncate text-xs text-zinc-500">{profile?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <LogOut size={16} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  )
}
