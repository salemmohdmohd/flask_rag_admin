import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/theme.css'

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
