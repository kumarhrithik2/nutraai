/**
 * Section: AI wellness assistant  (pages/DashboardPages.jsx: AssistantPage)
 */
import { apiClient } from './core.js'

/**
 * Purpose: send a question and get the assistant's reply (educational guidance only).
 * Endpoint: POST /assistant/messages/   [NOT IN BACKEND YET: fails with 404]
 * Params: question: string (up to the textarea's maxLength)
 * Returns: Promise<{ id, answer, createdAt }>
 */
export async function askAssistant(question) {
  const { data } = await apiClient.post('/assistant/messages/', { question: String(question).trim() })
  return { id: data.id, answer: data.answer, createdAt: data.created_at }
}
