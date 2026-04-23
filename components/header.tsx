'use client'

import Image from 'next/image'
import { useAuth } from '@/context/auth-context'
import { UserProfile } from './user-profile'

export function Header() {
  const { isAuthenticated, isAdmin, isConducteur, role } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700">
              <Image
                src="/logo-cgi.png"
                alt="Comptoir Guetat Industrie"
                width={180}
                height={180}
                className="object-contain"
              />
            </div>
            <div className="hidden sm:flex flex-col justify-center min-w-0">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate">
                Comptoir Guetat
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Production & Stocks
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* User Info - Visible on larger screens */}
            {isAuthenticated && (
              <div className="hidden md:flex flex-col items-end justify-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                    isAdmin 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {isAdmin ? '👨‍💼 Admin' : '👷 Conducteur'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mon espace</p>
              </div>
            )}

            {/* User Profile Dropdown */}
            {isAuthenticated && <UserProfile />}
          </div>
        </div>

        {/* Secondary Info Bar - Mobile */}
        {isAuthenticated && (
          <div className="sm:hidden flex items-center justify-between py-2 px-0 border-t border-slate-100 dark:border-slate-800">
            <span className={`text-xs font-semibold rounded px-2 py-1 ${
              isAdmin 
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
            }`}>
              {isAdmin ? '👨‍💼 Admin' : '👷 Conducteur'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Production & Stocks</p>
          </div>
        )}
      </div>
    </header>
  )
}
