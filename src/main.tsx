import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { UpdateBanner } from './features/pwa/UpdateBanner'
import { VaultProvider } from './features/vault/VaultProvider'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <VaultProvider>
      <App />
    </VaultProvider>
    <UpdateBanner />
  </StrictMode>,
)
