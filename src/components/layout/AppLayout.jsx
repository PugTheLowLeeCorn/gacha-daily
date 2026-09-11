import { Outlet } from 'react-router-dom'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="min-h-svh bg-[#f3f1ea] text-zinc-900 dark:bg-[#0b0e14] dark:text-zinc-100">
      <div className="mx-auto flex min-h-svh max-w-7xl">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <main className="flex-1 px-4 py-5 pb-24 lg:px-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
