"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Search, User, Ticket } from "lucide-react"
import { useState } from "react"

export function Header() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Ticket className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            SeatSecure
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: "/", label: "Now Showing" },
            { href: "/coming-soon", label: "Coming Soon" },
            { href: "/cinemas", label: "Cinemas" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
            aria-label="Search movies"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
            aria-label="User profile"
          >
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 pb-3 max-w-7xl mx-auto animate-fade-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search movies, cinemas, genres..."
              className="w-full bg-secondary rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
