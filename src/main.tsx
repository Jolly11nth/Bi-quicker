import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AutoRiderAssignment } from './components/AutoRiderAssignment'
import '../styles.css'
import './logo-overrides.css'
import './commerce.css'
import './dashboard-polish.css'
import './dashboard-shell.css'
import './dashboard-content.css'
import './dashboard-interactions.css'
import './dashboard-logo-fix.css'
import './commerce-pricing-ui'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AutoRiderAssignment />
    <App />
  </React.StrictMode>,
)
