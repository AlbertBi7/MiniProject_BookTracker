import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { BooksProvider } from './context/BooksContext.jsx'
import './styles/tokens.css'
import './styles/app.css'

const container = document.getElementById('root')

createRoot(container).render(
  <React.StrictMode>
    <BooksProvider>
      <App />
    </BooksProvider>
  </React.StrictMode>,
)
