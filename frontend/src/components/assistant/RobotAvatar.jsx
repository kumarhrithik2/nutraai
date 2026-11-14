function RobotAvatar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="companion-shell" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f8f6e9" />
          <stop offset=".48" stopColor="#cbd9c7" />
          <stop offset="1" stopColor="#82988a" />
        </linearGradient>
        <linearGradient id="companion-body" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e8efe2" />
          <stop offset="1" stopColor="#8ca392" />
        </linearGradient>
        <radialGradient id="companion-eye">
          <stop offset="0" stopColor="#fff8d8" />
          <stop offset=".38" stopColor="#e7d09a" />
          <stop offset="1" stopColor="#5bd9a3" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="106" rx="33" ry="7" fill="#102c24" opacity=".24" />
      <path d="M37 78c-11 0-19 8-20 19l17 5 10-19zM83 78c11 0 19 8 20 19l-17 5-10-19z" fill="url(#companion-body)" stroke="#d7e3d2" strokeWidth="2" />
      <rect x="51" y="65" width="18" height="19" rx="8" fill="#849b8c" stroke="#d8e3d3" strokeWidth="2" />
      <path d="M36 81c0-7 6-12 13-12h22c7 0 13 5 13 12v18H36z" fill="url(#companion-body)" stroke="#e1eadc" strokeWidth="2" />
      <path d="M52 83h16v3H52z" fill="#d4aa68" opacity=".9" />
      <rect x="39" y="28" width="42" height="40" rx="15" fill="url(#companion-shell)" stroke="#f4f4e7" strokeWidth="2" />
      <path d="M45 42c0-7 5-12 12-12h9c6 0 11 5 11 12v8c0 6-5 11-11 11h-9c-7 0-12-5-12-11z" fill="#153d32" />
      <ellipse className="robot-avatar__eye" cx="52" cy="47" rx="4.3" ry="5.4" fill="url(#companion-eye)" />
      <ellipse className="robot-avatar__eye" cx="68" cy="47" rx="4.3" ry="5.4" fill="url(#companion-eye)" />
      <path d="M53 57q7 4 14 0" fill="none" stroke="#93d7b4" strokeLinecap="round" strokeWidth="1.5" opacity=".8" />
      <path d="M60 28V18" stroke="#d8e3d2" strokeLinecap="round" strokeWidth="3" />
      <circle cx="60" cy="16" r="4" fill="#d4aa68" stroke="#f5e6bf" strokeWidth="1.5" />
      <circle cx="40" cy="49" r="3" fill="#d4aa68" />
      <circle cx="80" cy="49" r="3" fill="#d4aa68" />
      <path d="M31 94c-2 2-3 5-3 8M89 94c2 2 3 5 3 8" fill="none" stroke="#f2f1e7" strokeLinecap="round" strokeWidth="3" />
      <circle cx="35" cy="102" r="5" fill="#dce8d7" />
      <circle cx="85" cy="102" r="5" fill="#dce8d7" />
    </svg>
  )
}

export default RobotAvatar
