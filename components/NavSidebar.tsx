"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, Calendar, Users, Award, Home, Info, Settings, Shield } from "lucide-react"
import UserIndicator from "./UserIndicator"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/players", label: "Spelers", icon: Users },
  { href: "/matches", label: "Matchen", icon: Calendar },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/motm", label: "Man v/d Match", icon: Award },
  { href: "/about", label: "Over ons", icon: Info },
]

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/login", label: "Inloggen", icon: Settings },
]

export default function NavSidebar() {
  const pathname = usePathname()

  function navClass(href: string) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href))
    return [
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
      active
        ? "text-white"
        : "hover:text-white",
    ].join(" ")
  }

  function navStyle(href: string): React.CSSProperties {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href))
    return {
      color: active ? "white" : "oklch(0.75 0.04 280)",
      background: active ? "oklch(1 0 0 / 12%)" : "transparent",
    }
  }

  return (
    <aside
      style={{
        background: "oklch(1 0 0 / 6%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRight: "1px solid oklch(1 0 0 / 10%)",
      }}
      className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen z-30"
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))" }}
          >
            FK
          </div>
          <div>
            <div className="font-semibold text-sm text-white leading-tight">FC Krabpull</div>
            <div className="text-xs" style={{ color: "oklch(0.55 0.05 280)" }}>Zaalvoetbal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.45 0.05 280)" }}>
          Hoofdmenu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={navClass(href)} style={navStyle(href)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.45 0.05 280)" }}>
            Beheer
          </p>
          {adminItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={navClass(href)} style={navStyle(href)}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User indicator footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <UserIndicator />
      </div>
    </aside>
  )
}
