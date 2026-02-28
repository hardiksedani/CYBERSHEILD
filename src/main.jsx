import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('🚀 React main.jsx loading...')
const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

// Test if DOM is ready
console.log('DOM ready check - document.body:', document.body)
console.log('DOM ready check - document.documentElement.innerHTML:', document.documentElement.innerHTML.substring(0, 200))

if (rootElement) {
  console.log('✅ Root element found, mounting React...')
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('✅ React mounted successfully')
  } catch (e) {
    console.error('❌ Error mounting React:', e)
  }
} else {
  console.error('❌ Root element not found!')
}
