import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import ChatCenter from "./pages/ChatCenter/ChatCenter"
import LoginPage from "./pages/LoginPage/LoginPage"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import DiagnosticForm from "./pages/Diagnostics/DiagnosticForm"
import DiagnosticResult from "./pages/Diagnostics/DiagnosticResult"
import "./index.css"

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="text-white">Cargando...</div>
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* ChatCenter (privada) */}
          <Route
            path="/chat-center"
            element={
              <PrivateRoute>
                <ChatCenter />
              </PrivateRoute>
            }
          />

          {/* Diagnósticos */}
          <Route
            path="/diagnostico"
            element={
              <PrivateRoute>
                <DiagnosticForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/diagnostics/result/:id"
            element={
              <PrivateRoute>
                <DiagnosticResult />
              </PrivateRoute>
            }
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
