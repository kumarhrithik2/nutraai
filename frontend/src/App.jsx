import { BrowserRouter } from 'react-router-dom'
import FloatingAICompanion from './components/assistant/FloatingAICompanion.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <FloatingAICompanion />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
