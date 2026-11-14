import { BrowserRouter } from 'react-router-dom'
import FloatingAICompanion from './components/assistant/FloatingAICompanion.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <FloatingAICompanion />
    </BrowserRouter>
  )
}

export default App
