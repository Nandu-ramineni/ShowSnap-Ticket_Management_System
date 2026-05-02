"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Ticket, Heart, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/bookings", icon: Ticket, label: "Bookings" },
  { href: "/favorites", icon: Heart, label: "Saved" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide on seat selection and booking pages
  const hideOn = ["/select-seats", "/booking"]
  const shouldHide = hideOn.some((path) => pathname.startsWith(path))
  if (shouldHide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass md:hidden" role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[48px] min-h-[48px] justify-center",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
