import { useEffect, useRef, useState } from 'react'
import { Sparkles, Activity, Users, BarChart3, Shield, Brain, Clock } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const ICONS = [
  { Icon: Sparkles, label: 'AI insights' },
  { Icon: Activity, label: 'Health metrics' },
  { Icon: Users, label: 'Customer care' },
  { Icon: BarChart3, label: 'Platform analytics' },
  { Icon: Shield, label: 'Secure data' },
  { Icon: Brain, label: 'Wellness intelligence' },
]

export default function AdminHeroSection() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [time, setTime] = useState(new Date())
  const containerRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' }

  return (
    <section ref={containerRef} className={`admin-hero relative overflow-hidden rounded-3xl border p-8 md:p-12 shadow-xl transition-colors duration-300 sticky top-0 z-20 w-full admin-enter ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
      {/* Decorative geometric elements */}
      <div className="absolute top-0 right-0 -mx-6 -my-6 w-32 h-32 rounded-full opacity-10 blur-3xl transition-colors duration-300">
        <div className="w-full h-full rounded-full" />
      </div>
      <div className="absolute bottom-0 left-0 -mx-8 -my-8 w-40 h-40 rounded-full opacity-10 blur-3xl transition-colors duration-300">
        <div className="w-full h-full rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start gap-8">
        <div className="flex-1 admin-stagger-child">
          <div className="flex items-center gap-2 mb-3 admin-enter-delay-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${dark ? 'bg-[#222] text-[#C6A36B] border border-[#383027]' : 'bg-[#e8f0e5] text-[#173d32]'}`}>
              <Clock size={16} />
            </div>
            <div className="text-right hidden sm:block">
              <div className={`text-sm font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
                {time.toLocaleDateString(undefined, options)}
              </div>
              <div className={`text-[11px] font-mono transition-colors duration-300 ${dark ? 'text-[#C6A36B]' : 'text-[#237a53]'}`}>
                {time.toLocaleTimeString(undefined, timeOptions)}
              </div>
            </div>
          </div>

          <div className="mb-6 admin-enter-delay-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${dark ? 'bg-[#1a1a1a] text-[#C6A36B] border border-[#383027]' : 'bg-[#e8f0e5] text-[#173d32]'}`}>
              Dashboard Command Center
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-3 transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
              Platform Overview
            </h2>
            <p className={`text-sm sm:text-base leading-relaxed transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              Real-time metrics, health assessment analytics, AI usage insights, and platform health — all powered by live backend data.
            </p>
          </div>

          <div className="flex gap-3 admin-enter-delay-3">
            <button className="admin-card-hover px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 flex items-center gap-2 shadow-sm">
              <Sparkles size={14} />
              <span>View AI Recommendations</span>
            </button>
            <button className="admin-card-hover px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 flex items-center gap-2 border">
              <Activity size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="flex-1 lg:w-96 admin-stagger-child admin-enter-delay-4">
          <div className="grid grid-cols-2 gap-3">
            {ICONS.map(({ Icon: Comp, label }) => (
              <div
                key={label}
                className={`admin-card-hover p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 group ${dark ? 'bg-[#1a1a1a] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${dark ? 'bg-[#222] text-[#C6A36B]' : 'bg-[#e8f0e5] text-[#173d32]'}`}>
                  <Comp size={16} />
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${dark ? 'text-white' : 'text-[#20342d]'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
