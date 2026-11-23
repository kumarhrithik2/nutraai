/**
 * Section: AI wellness assistant  (pages/DashboardPages.jsx: AssistantPage)
 */
import { apiClient } from './core.js'
import { getAccessToken } from './core.js'

/**
 * Purpose: send a question and get the assistant's reply (educational guidance only).
 * Endpoint: POST /assistant/messages/  (apps.customer.views.AssistantMessageView)
 * Params: question: string (up to the textarea's maxLength)
 * Returns: Promise<{ id, answer, createdAt }>
 */
export async function askAssistant(question) {
  if (!getAccessToken()) {
    throw Object.assign(new Error('Authentication required.'), {
      apiError: { status: 401, code: 'unauthenticated', message: 'Please sign in to use the AI assistant.', details: null },
    })
  }
  const { data } = await apiClient.post('/assistant/messages/', { question: String(question).trim() })
  const answer = typeof data?.answer === 'string' ? data.answer : ''
  if (!answer) {
    throw Object.assign(new Error('The assistant returned an empty response.'), {
      apiError: { status: 502, code: 'empty_response', message: 'The assistant returned an empty response.', details: null },
    })
  }
  return { id: data?.id ?? null, answer, createdAt: data?.created_at ?? null }
}
