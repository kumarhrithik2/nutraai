import { useEffect, useState, useRef } from 'react'
import { Activity, Database, Shield, Zap, Clock } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import apiClient from '../../services/apiClient'

const SERVICES = [
  { id: 'api', name: 'Backend API', icon: Activity, endpoint: '/admin/overview/' },
  { id: 'database', name: 'Database', icon: Database, endpoint: '/admin/overview/' },
  { id: 'ai', name: 'AI Service', icon: BrainIcon, endpoint: '/admin/overview/' },
  { id: 'auth', name: 'Authentication', icon: Shield, endpoint: '/admin/overview/' },
  { id: 'jobs', name: 'Background Jobs', icon: Zap, endpoint: '/admin/overview/' },
]

function BrainIcon(props) {
  return <Activity {...props} />
}

function StatusIndicator({ status }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const styles = {
    operational: dark ? 'bg-[#C6A36B] text-[#C6A36B]' : 'bg-[#10b981] text-[#10b981]',
    degraded: dark ? 'bg-[#F0DDB7] text-[#F0DDB7]' : 'bg-[#f59e0b] text-[#f59e0b]',
    down: dark ? 'bg-[#F0DDB7] text-[#F0DDB7]' : 'bg-[#ef4444] text-[#ef4444]',
  }

  return (
    <span className={`w-2 h-2 rounded-full animate-pulse ${styles[status] || styles.degraded}`} />
  )
}

export default function PlatformHealthSection() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [statuses, setStatuses] = useState({})
  const [lastChecked, setLastChecked] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const intervalRef = useRef(null)

  const checkHealth = async () => {
    setIsChecking(true)
    const results = {}
    await Promise.all(
      SERVICES.map(async (svc) => {
        try {
          const start = Date.now()
          await apiClient.get(svc.endpoint)
          const latency = Date.now() - start
          results[svc.id] = { status: latency < 2000 ? 'operational' : 'degraded', latency }
        } catch {
          results[svc.id] = { status: 'down', latency: null }
        }
      }),
    )
    setStatuses(results)
    setLastChecked(new Date())
    setIsChecking(false)
  }

  useEffect(() => {
    const run = async () => {
      await checkHealth()
    }
    run()
    intervalRef.current = setInterval(checkHealth, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const getStatusLabel = (status) => {
    const labels = { operational: 'Operational', degraded: 'Degraded', down: 'Down' }
    return labels[status] || 'Unknown'
  }

  return (
    <section className="admin-enter space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full" />
            <span className="font-semibold">Platform Health</span>
          </div>
          <h3 className={`text-sm font-bold mt-0.5 transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
            System monitoring
          </h3>
          <p className={`text-[11px] mt-0.5 transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
            Live status from backend health-check endpoints{lastChecked ? ` • last checked ${lastChecked.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={checkHealth}
          disabled={isChecking}
          className={`admin-card-hover p-2 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-2 border ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#C6A36B] hover:bg-[#222]' : 'bg-white border-[#e5eae3] text-[#173d32] hover:bg-[#f6f4ec]'}`} disabled={isChecking}
        >
          <Clock size={12} className={isChecking ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {SERVICES.map((svc) => {
          const status = statuses[svc.id]?.status || 'degraded'
          const latency = statuses[svc.id]?.latency
          const Icon = svc.icon
          return (
            <div
              key={svc.id}
              className={`admin-card-hover p-3 rounded-xl border flex flex-col gap-2 transition-all duration-300 group ${dark ? 'bg-[#1a1a1a] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${dark ? 'bg-[#222]' : 'bg-[#f0f4ed]'}`}>
                  <Icon size={14} className={`transition-colors duration-300 ${dark ? 'text-[#C6A36B]' : 'text-[#237a53]'}`} />
                </div>
                <StatusIndicator status={status} />
              </div>
              <div>
                <div className={`text-xs font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#20342d]'}`}>
                  {svc.name}
                </div>
                <div className={`text-[10px] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
                  {getStatusLabel(status)}
                  {latency !== null ? ` • ${latency}ms` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isChecking && (
        <div className="h-2 w-full rounded-full overflow-hidden bg-[#222]">
          <div className="h-full bg-[#C6A36B] animate-[width_1.5s_ease-in-out_infinite_alternate] w-1/3" />
        </div>
      )}
    </section>
  )
}
