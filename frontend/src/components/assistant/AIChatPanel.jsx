import { Suspense, useEffect, useRef } from 'react'
import { ArrowUp, Bot, ChevronDown, LoaderCircle, Sparkles, Trash2, X } from 'lucide-react'
import RobotAvatar from './RobotAvatar.jsx'

const suggestedQuestions = [
  'How can I improve my daily nutrition?',
  'Help me understand my wellness goals.',
  'What should I consider before choosing supplements?',
]

function AIChatPanel({
  messages,
  feedback,
  inputRef,
  onClose,
  onClear,
  onDraftQuestion,
  onMinimize,
  onReady,
  onSend,
  RobotCharacter,
  value,
  onChange,
  disabled = false,
  isLoading = false,
  error = '',
  onRetry,
  variant = 'floating',
}) {
  const conversationRef = useRef(null)

  useEffect(() => {
    if (conversationRef.current) conversationRef.current.scrollTop = conversationRef.current.scrollHeight
  }, [messages, isLoading, error])

  useEffect(() => {
    onReady()
  }, [onReady])

  const statusLabel = isLoading ? 'Thinking…' : 'AI wellness assistant'

  return (
    <section
      className={`ai-companion__panel${variant === 'page' ? ' ai-companion__panel--page' : ''}`}
      id="nutraai-assistant-panel"
      aria-label="NutraAI assistant panel"
    >
      <header className="ai-companion__header">
        <div className="ai-companion__avatar">
          <Suspense fallback={<div className="ai-companion__scene-fallback" role="img" aria-label="NutraAI robot companion"><RobotAvatar /></div>}>
            <RobotCharacter />
          </Suspense>
        </div>
        <div className="ai-companion__identity">
          <strong>NutraAI companion</strong>
          <span className={isLoading ? 'is-thinking' : 'is-online'}><i aria-hidden="true" /> {statusLabel}</span>
        </div>
        <div className="ai-companion__controls">
          {messages.length > 0 && <button type="button" aria-label="Clear conversation" title="Clear conversation" onClick={onClear}><Trash2 size={16} /></button>}
          <button type="button" aria-label="Minimize assistant" title="Minimize assistant" onClick={onMinimize}><ChevronDown size={18} /></button>
          <button type="button" aria-label="Close assistant" title="Close assistant" onClick={onClose}><X size={17} /></button>
        </div>
      </header>

      <div className="ai-companion__conversation" ref={conversationRef} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
        <div className="ai-companion__welcome">
          <span className="ai-companion__welcome-mark"><Bot size={17} /></span>
          <div>
            <strong>A thoughtful space for your wellness questions.</strong>
            <p>Ask about nutrition, sleep, activity or supplements. Replies are educational guidance, not medical advice.</p>
          </div>
        </div>

        {messages.length === 0 && <div className="ai-companion__suggestions" aria-label="Suggested questions">
          <span>YOU COULD ASK</span>
          {suggestedQuestions.map((question) => (
            <button type="button" key={question} onClick={() => onDraftQuestion(question)} disabled={disabled || isLoading}>
              <Sparkles size={13} />{question}
            </button>
          ))}
        </div>}

        {messages.map((message) => {
          const isAssistant = message.role === 'assistant'
          return (
            <div
              className={`ai-companion__message ${isAssistant ? 'ai-companion__message--assistant' : 'ai-companion__message--user'}`}
              key={message.id || `${message.role}-${message.content.slice(0, 12)}`}
            >
              <span>{isAssistant ? 'NutraAI' : 'You'}</span>
              <p>{message.content}</p>
            </div>
          )
        })}

        {isLoading && (
          <div className="ai-companion__message ai-companion__message--assistant" aria-hidden="true">
            <span>NutraAI</span>
            <p className="ai-companion__typing"><LoaderCircle size={14} className="is-spinning" /> Preparing a reply…</p>
          </div>
        )}

        {error && (
          <div className="ai-companion__message ai-companion__message--error" role="alert">
            <span>Message not sent</span>
            <p>{error}</p>
            {onRetry && (
              <button type="button" className="ai-companion__retry" onClick={onRetry} disabled={isLoading}>
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      <div className="ai-companion__service-note" aria-live="polite" role="status">
        {feedback || (error ? 'Your message was not delivered. Use Try again to resend it.' : 'General wellness information is not medical advice.')}
      </div>

      <form className="ai-companion__form" onSubmit={onSend}>
        <label className="ai-companion__sr-only" htmlFor="nutraai-assistant-message">Your message</label>
        <textarea
          id="nutraai-assistant-message"
          ref={inputRef}
          value={value}
          onChange={onChange}
          placeholder="Write a wellness question..."
          rows={2}
          disabled={disabled}
        />
        <button type="submit" aria-label="Send message" disabled={disabled || isLoading || !value.trim()}>
          {isLoading ? <LoaderCircle size={18} className="is-spinning" /> : <ArrowUp size={18} />}
        </button>
      </form>
      <p className="ai-companion__disclaimer">General wellness information is not medical advice.</p>
    </section>
  )
}

export default AIChatPanel