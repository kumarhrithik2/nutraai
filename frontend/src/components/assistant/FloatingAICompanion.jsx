import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { useLocation } from 'react-router-dom'
import RobotAvatar from './RobotAvatar.jsx'
import useAssistantChat from './useAssistantChat.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './assistant.css'

const AIChatPanel = lazy(() => import('./AIChatPanel.jsx'))
const RobotCharacter = lazy(() => import('./RobotCharacter.jsx'))

function FloatingAICompanionInner({ isDashboard }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const messageRef = useRef(null)
  const contentRef = useRef(null)
  const chat = useAssistantChat()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen || !panelRef.current) return undefined

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(panelRef.current, { autoAlpha: 1, scale: 1, x: 0, y: 0, clipPath: 'circle(150% at 90% 92%)' })
        gsap.set(contentRef.current?.children, { autoAlpha: 1, y: 0 })
        return
      }

      const timeline = gsap.timeline()
      timeline.fromTo(panelRef.current,
        { autoAlpha: 0, scale: 0.78, x: 28, y: 30, clipPath: 'circle(0% at 90% 92%)' },
        { autoAlpha: 1, scale: 1, x: 0, y: 0, clipPath: 'circle(150% at 50% 50%)', duration: 0.62, ease: 'power3.out' })
      timeline.fromTo(contentRef.current?.children,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.075, ease: 'power2.out' },
        '-=0.28')
    }, panelRef)

    return () => context.revert()
  }, [isOpen, reducedMotion])

  const closePanel = useCallback(() => {
    setIsOpen(false)
    window.requestAnimationFrame(() => buttonRef.current?.focus())
  }, [])

  const handlePanelReady = useCallback(() => messageRef.current?.focus(), [])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePanel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closePanel, isOpen])

  const handleSend = (event) => {
    event.preventDefault()
    return chat.send()
  }

  const handleClear = () => {
    chat.clear()
  }

  const handleSuggestedQuestion = (question) => {
    chat.draft(question)
    messageRef.current?.focus()
  }

  return (
    <div className={`ai-companion${isDashboard ? ' ai-companion--dashboard' : ''}${isOpen ? ' ai-companion--open' : ''}`}>
      {isOpen && <div className="ai-companion__dialog" ref={panelRef} role="dialog" aria-modal="false" aria-labelledby="nutraai-assistant-title">
        <div ref={contentRef}>
          <h2 className="ai-companion__sr-only" id="nutraai-assistant-title">NutraAI wellness assistant</h2>
          <Suspense fallback={<div className="ai-companion__loading" role="status">Preparing your companion…</div>}>
            <AIChatPanel
              messages={chat.messages}
              feedback={chat.feedback}
              inputRef={messageRef}
              onClose={closePanel}
              onClear={handleClear}
              onDraftQuestion={handleSuggestedQuestion}
              onMinimize={closePanel}
              onReady={handlePanelReady}
              onSend={handleSend}
              RobotCharacter={RobotCharacter}
              value={chat.value}
              onChange={(event) => chat.setValue(event.target.value)}
              isLoading={chat.isLoading}
              error={chat.error}
              onRetry={chat.retry}
            />
          </Suspense>
        </div>
      </div>}
      <button
        ref={buttonRef}
        className="ai-companion__trigger"
        type="button"
        aria-label={isOpen
          ? 'Ask NutraAI Wellness companion. Assistant open'
          : 'Ask NutraAI Wellness companion. Open assistant'}
        aria-expanded={isOpen}
        aria-controls="nutraai-assistant-panel"
        onClick={() => {
          if (!isOpen) setIsOpen(true)
        }}
      >
        <span className="ai-companion__trigger-ring" aria-hidden="true" />
        <span className="ai-companion__trigger-avatar"><RobotAvatar /></span>
        <span className="ai-companion__trigger-sparkle" aria-hidden="true"><Sparkles size={15} /></span>
        <span className="ai-companion__trigger-label">Ask NutraAI</span>
        <span className="ai-companion__trigger-status"><Bot size={12} /> Wellness companion</span>
      </button>
    </div>
  )
}

function FloatingAICompanion() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const isDashboard = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
  const isCustomerSession = isAuthenticated && user?.role !== 'admin'
  const canUseAssistant = isDashboard && isCustomerSession

  if (!canUseAssistant) return null

  return <FloatingAICompanionInner key={user?.id ?? user?.email ?? 'customer'} isDashboard={isDashboard} />
}

export default FloatingAICompanion
