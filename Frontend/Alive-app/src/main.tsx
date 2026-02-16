import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@fontsource/material-symbols-outlined'
import { initNativeShell } from '@/lib/native-shell'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Do not block the first paint on native plugin setup.
void initNativeShell()
