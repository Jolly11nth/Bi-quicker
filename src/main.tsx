import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AutoRiderAssignment } from './components/AutoRiderAssignment'
import '../styles.css'
import './logo-overrides.css'
import './commerce.css'
import './dashboard-polish.css'
import './dashboard-shell.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AutoRiderAssignment />
    <App />
  </React.StrictMode>,
)
