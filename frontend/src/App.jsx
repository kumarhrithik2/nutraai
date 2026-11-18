import { BrowserRouter } from 'react-router-dom'
import FloatingAICompanion from './components/assistant/FloatingAICompanion.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <FloatingAICompanion />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
