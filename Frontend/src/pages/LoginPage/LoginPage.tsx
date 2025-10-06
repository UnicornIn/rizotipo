import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import logorizosfelices from "../../assets/logorizosfelices.png"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const mockUser = {
    email: "demo@rizotipo.com",
    password: "123456",
    name: "usuario demo",
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const success = await login(email, password, rememberMe)

    if (success) {
      navigate("/chat-center")
    } else {
      setError("Credenciales incorrectas")
    }

    setIsLoading(false)
  }

  const handleDemoLogin = () => {
    setEmail(mockUser.email)
    setPassword(mockUser.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2"
            style={{ borderColor: "#F198C0" }}
          >
            <img
              src={logorizosfelices}
              alt="Rizotipo Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">RIZOTIPO ONLINE</h1>
        </div>

        {/* Caja de login */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Iniciar Sesión</h2>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">Accede a tu cuenta</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 
                    focus:outline-none focus:ring-1 focus:ring-[#F198C0] focus:border-[#F198C0] transition-all duration-200 text-sm sm:text-base"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 
                    focus:outline-none focus:ring-1 focus:ring-[#F198C0] focus:border-[#F198C0] transition-all duration-200 text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-[#F198C0] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[#F198C0] bg-zinc-800 border-zinc-600 rounded focus:ring-[#F198C0] focus:ring-1"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-zinc-300">
                Recordar sesión
              </label>
            </div>

            {/* Botón login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-medium rounded-lg transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              style={{ backgroundColor: "#F198C0" }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* Demo login button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="mt-4 w-full py-2 px-4 text-white font-medium rounded-lg transition-all duration-200 bg-zinc-700 hover:bg-zinc-800 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Usar usuario demo
          </button>

        </div>
      </div>
    </div>
  )
}