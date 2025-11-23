import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from './providers/AuthProvider'
import { AppQueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { router } from './routes'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppQueryProvider>
          <RouterProvider router={router} />
        </AppQueryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
