'use client'

import { App } from './App'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'

import './index.css'

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
