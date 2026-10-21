import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { assertProductionApiConfig } from './lib/local-mode'

assertProductionApiConfig({
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
  VITE_USE_LOCAL_API: import.meta.env.VITE_USE_LOCAL_API,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
