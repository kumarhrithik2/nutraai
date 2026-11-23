import { Activity, ShoppingCart, Users, RefreshCw, Sparkles, FileText } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const EVENT_ICONS = {
  registration: Users,
  assessment: FileText,
  order: ShoppingCart,
  admin: Activity,
  ai: Sparkles,
  subscription: RefreshCw,
}

const EVENT_LABELS = {
  registration: 'New customer registration',
  assessment: 'Health assessment submitted',
  order: 'Order placed',
  admin: 'Admin action performed',
  ai: 'AI recommendation generated',
  subscription: 'Subscription updated',
}

export default function ActivityTimeline({ activities = [] }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const displayActivities = activities.slice(0, 10)

  return (
    <section className="admin-enter space-y-0">
      <div className="relative flex-1">
        {/* Timeline connector line */}
        <div className={`absolute left-3 top-0 bottom-0 w-px ${dark ? 'bg-[#383027]' : 'bg-[#e5eae3]'}`} />

        {displayActivities.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity size={20} className="text-[#B9AA98]" />
            </div>
            <p className={`text-xs transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
              No recent activity recorded.
            </p>
          </div>
        ) : (
          displayActivities.map((activity, index) => {
            const Icon = EVENT_ICONS[activity.type] || Activity
            const isLast = index === displayActivities.length - 1
            return (
              <div
                key={activity.id || index}
                className={`admin-card-hover flex items-start gap-3 pl-8 pr-2 py-3 transition-all duration-300 ${dark ? 'hover:bg-[#222]' : 'hover:bg-[#f6f4ec]'}`}
              >
                <div className={`relative flex-shrink-0 mt-1`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027] text-[#C6A36B]' : 'bg-white border-[#e5eae3] text-[#237a53]'}`}>
                    <Icon size={14} />
                  </div>
                  {!isLast && (
                    <div className={`absolute -left-px top-7 bottom-0 w-px ${dark ? 'bg-[#383027]' : 'bg-[#e5eae3]'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#20342d]'}`}>
                      {EVENT_LABELS[activity.type] || activity.action || 'Activity'}
                    </span>
                    {activity.actorEmail && (
                      <span className={`text-[11px] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
                        by {activity.actorEmail}
                      </span>
                    )}
                    {activity.targetType && (
                      <span className={`text-[11px] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
                        - {activity.targetType} #{activity.targetId}
                      </span>
                    )}
                  </div>
                  <div className={`mt-0.5 text-[11px] transition-colors duration-300 ${dark ? 'text-[#8a7a66]' : 'text-[#718078]'}`}>
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '-'}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
