import '@fontsource/anton/latin-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-600.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './shared/styles/global.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('The #root element is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
