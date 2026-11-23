function RobotAvatar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="companion-shell" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F5EBDD" />
          <stop offset=".48" stopColor="#E2C99F" />
          <stop offset="1" stopColor="#A98253" />
        </linearGradient>
        <linearGradient id="companion-body" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#E2C99F" />
          <stop offset="1" stopColor="#C5A071" />
        </linearGradient>
        <radialGradient id="companion-eye">
          <stop offset="0" stopColor="#FFF8DC" />
          <stop offset=".38" stopColor="#C5A071" />
          <stop offset="1" stopColor="#A98253" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="106" rx="33" ry="7" fill="#102c24" opacity=".24" />
      <path d="M37 78c-11 0-19 8-20 19l17 5 10-19zM83 78c11 0 19 8 20 19l-17 5-10-19z" fill="url(#companion-body)" stroke="#E2C99F" strokeWidth="2" />
      <rect x="51" y="65" width="18" height="19" rx="8" fill="#C5A071" stroke="#E2C99F" strokeWidth="2" />
      <path d="M36 81c0-7 6-12 13-12h22c7 0 13 5 13 12v18H36z" fill="url(#companion-body)" stroke="#E2C99F" strokeWidth="2" />
      <path d="M52 83h16v3H52z" fill="#C5A071" opacity=".9" />
      <rect x="39" y="28" width="42" height="40" rx="15" fill="url(#companion-shell)" stroke="#F5EBDD" strokeWidth="2" />
      <path d="M45 42c0-7 5-12 12-12h9c6 0 11 5 11 12v8c0 6-5 11-11 11h-9c-7 0-12-5-12-11z" fill="#1a1a1a" />
      <ellipse className="robot-avatar__eye" cx="52" cy="47" rx="4.3" ry="5.4" fill="url(#companion-eye)" />
      <ellipse className="robot-avatar__eye" cx="68" cy="47" rx="4.3" ry="5.4" fill="url(#companion-eye)" />
      <path d="M53 57q7 4 14 0" fill="none" stroke="#C5A071" strokeLinecap="round" strokeWidth="1.5" opacity=".8" />
      <path d="M60 28V18" stroke="#E2C99F" strokeLinecap="round" strokeWidth="3" />
      <circle cx="60" cy="16" r="4" fill="#C5A071" stroke="#E2C99F" strokeWidth="1.5" />
      <circle cx="40" cy="49" r="3" fill="#C5A071" />
      <circle cx="80" cy="49" r="3" fill="#C5A071" />
      <path d="M31 94c-2 2-3 5-3 8M89 94c2 2 3 5 3 8" fill="none" stroke="#E2C99F" strokeLinecap="round" strokeWidth="3" />
      <circle cx="35" cy="102" r="5" fill="#E2C99F" />
      <circle cx="85" cy="102" r="5" fill="#E2C99F" />
    </svg>
  )
}

export default RobotAvatar
