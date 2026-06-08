import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// =============================================================================
// Точка входа: монтирует <App/> в #root.
// StrictMode — режим разработки: помогает находить небезопасные паттерны и
// намеренно дважды вызывает эффекты (в проде этого нет).
// =============================================================================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
