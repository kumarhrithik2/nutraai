import axios from 'axios'

// One axios instance for the whole app. The URL comes from the environment so no backend
// URL is hardcoded here (see .env.example). The fallback is the versioned API path that the
// Vite dev server proxies to Django, never a bare "/api".
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
  timeout: 10000,
})

export default apiClient
