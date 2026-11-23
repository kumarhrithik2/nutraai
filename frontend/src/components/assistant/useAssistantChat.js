import { useCallback, useRef, useState } from 'react'
import { askAssistant } from '../../services/apiBackend/assistantApi.js'
import { getErrorMessage } from '../../services/apiBackend/core.js'

const MAX_QUESTION = 1000

/**
 * Shared chat state for both the floating companion and the assistant page.
 * Owns messages, draft, loading, error and retry so the UI stays presentational.
 */
export default function useAssistantChat() {
  const [messages, setMessages] = useState([])
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const lastQuestionRef = useRef('')
  const requestIdRef = useRef(0)
  const inFlightRef = useRef(false)

  const sendQuestion = useCallback(async (rawQuestion) => {
    const question = String(rawQuestion || '').trim()
    if (!question) {
      setFeedback('Enter a message before sending.')
      return
    }
    if (inFlightRef.current) return
    inFlightRef.current = true

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    lastQuestionRef.current = question

    setMessages((current) => [
      ...current,
      { id: `u-${requestId}`, role: 'user', content: question },
    ])
    setValue('')
    setError('')
    setFeedback('')
    setIsLoading(true)

    try {
      const reply = await askAssistant(question)
      if (requestId !== requestIdRef.current) return
      setMessages((current) => [
        ...current,
        {
          id: reply?.id || `a-${requestId}`,
          role: 'assistant',
          content: reply?.answer || 'Sorry, I could not generate a reply.',
        },
      ])
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(getErrorMessage(requestError, 'The assistant could not respond. Please try again.'))
      }
    } finally {
      inFlightRef.current = false
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [])

  const send = useCallback((event) => {
    event?.preventDefault?.()
    if (value.length > MAX_QUESTION) {
      setFeedback(`Keep your question under ${MAX_QUESTION} characters.`)
      return
    }
    return sendQuestion(value)
  }, [sendQuestion, value])

  const retry = useCallback(() => {
    if (!lastQuestionRef.current) return
    return sendQuestion(lastQuestionRef.current)
  }, [sendQuestion])

  const clear = useCallback(() => {
    requestIdRef.current += 1
    inFlightRef.current = false
    setMessages([])
    setValue('')
    setError('')
    setFeedback('')
    setIsLoading(false)
    lastQuestionRef.current = ''
  }, [])

  const draft = useCallback((question) => {
    setValue(question)
    setFeedback('')
  }, [])

  return {
    messages,
    value,
    setValue: (next) => {
      setValue(next)
      setFeedback('')
    },
    feedback,
    isLoading,
    error,
    send,
    retry,
    clear,
    draft,
    isEmpty: messages.length === 0,
    maxLength: MAX_QUESTION,
  }
}