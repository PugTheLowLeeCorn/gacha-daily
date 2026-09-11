import { NavLink } from 'react-router-dom'
import { navLinks } from './navLinks'
import { useAuth } from '../../hooks/useAuth'

export default function MobileNav() {
  const { profile, signOut } = useAuth()

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/90 lg:hidden">
        <p className="font-display text-lg font-bold">Gacha Daily</p>
        <div className="flex items-center gap-3">
          <img
            src={profile?.photoURL || '/favicon.svg'}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="max-w-28 truncate text-sm font-medium">{profile?.displayName || 'Player'}</span>
          <button type="button" className="text-sm text-zinc-500" onClick={signOut}>
            Logout
          </button>
        </div>
      </header>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200 bg-white/95 px-1 py-2 dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden"
      >
        {navLinks.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] ${
                  isActive ? 'text-amber-600 dark:text-amber-300' : 'text-zinc-500'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
