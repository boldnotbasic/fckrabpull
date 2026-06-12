import Link from 'next/link'
import { Users, Calendar, Shield, ArrowRight, Settings, Trophy } from 'lucide-react'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

const sections = [
  {
    href: '/admin/players',
    icon: Users,
    label: 'Spelers',
    desc: 'Toevoegen, foto uploaden, verwijderen',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.2 270), oklch(0.4 0.22 290))',
  },
  {
    href: '/admin/teams',
    icon: Shield,
    label: 'Teams',
    desc: 'Competitieteams & logo\'s beheren',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.18 220), oklch(0.4 0.2 240))',
  },
  {
    href: '/admin/matches',
    icon: Calendar,
    label: 'Matchen',
    desc: 'Plannen, uitslag & goals invoeren',
    gradient: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))',
  },
  {
    href: '/admin/trophies',
    icon: Trophy,
    label: 'Trofeënkast',
    desc: 'Trofeeën toevoegen & beheren',
    gradient: 'linear-gradient(135deg, oklch(0.65 0.2 45), oklch(0.55 0.22 60))',
  },
  {
    href: '/login',
    icon: Settings,
    label: 'Inloggen / Uitloggen',
    desc: 'Authenticatie beheren',
    gradient: 'linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.2 340))',
  },
]

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#d4a517' }}>Admin</h1>
        <p style={{ color: 'oklch(0.65 0.05 280)' }} className="text-sm">
          Beheer je team, matchen en data. Je moet ingelogd zijn als admin/manager.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, label, desc, gradient }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
            style={glass}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">{label}</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.65 0.05 280)' }}>{desc}</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: 'oklch(0.72 0.2 305)' }} />
          </Link>
        ))}
      </div>
    </div>
  )
}
