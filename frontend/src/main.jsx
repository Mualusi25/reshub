import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SavedProvider } from './context/SavedContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SavedProvider>
        <App />
      </SavedProvider>
    </AuthProvider>
  </BrowserRouter>
)
