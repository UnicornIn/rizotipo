import { useState, useEffect } from "react"
import { X, MessageSquare, Search, Plus, LogOut, Edit3 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../types/config"

interface SidebarProps {
  activeChat: string
  setActiveChat: (chat: string) => void
  chatSessionId: string
  setChatSessionId: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

interface ChatSession {
  id: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
  last_message: string | null
}

export default function Sidebar({ 
  setActiveChat, 
  chatSessionId, 
  setChatSessionId,
  isOpen, 
  onClose 
}: SidebarProps) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Cargar sesiones al montar el componente
  useEffect(() => {
    loadChatSessions()
  }, [])

  const loadChatSessions = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/agent/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const sessions = await response.json()
        setChatSessions(sessions)
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error)
    }
  }

  const filteredSessions = chatSessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNuevoChat = async () => {
    const nombre = prompt("Nombre de la nueva consulta:")
    if (nombre) {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/agent/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ title: nombre })
        })

        if (response.ok) {
          const data = await response.json()
          setActiveChat(nombre)
          setChatSessionId(data.chat_session_id)
          await loadChatSessions()
          onClose()
        } else {
          alert("Error al crear la nueva consulta")
        }
      } catch (error) {
        console.error("Error creating new chat:", error)
        alert("Error al crear la nueva consulta")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSelectChat = (session: ChatSession) => {
    setActiveChat(session.title)
    setChatSessionId(session.id)
    onClose()
  }

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditTitle(session.title)
  }

  const handleSaveEdit = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editTitle.trim()) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`https://longest-project-connectors-molecular.trycloudflare.com/agent/sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle.trim() })
      })

      if (response.ok) {
        await loadChatSessions()
        // Si estamos editando la sesión activa, actualizar el título también
        if (chatSessionId === sessionId) {
          setActiveChat(editTitle.trim())
        }
        setEditingSessionId(null)
        setEditTitle("")
      } else {
        alert("Error al actualizar la consulta")
      }
    } catch (error) {
      console.error("Error updating chat session:", error)
      alert("Error al actualizar la consulta")
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(null)
    setEditTitle("")
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("¿Estás seguro de que quieres eliminar esta consulta? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`https://longest-project-connectors-molecular.trycloudflare.com/agent/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Si eliminamos la sesión activa, limpiar el chat
        if (chatSessionId === sessionId) {
          setActiveChat("")
          setChatSessionId("")
        }
        await loadChatSessions()
      } else {
        alert("Error al eliminar la consulta")
      }
    } catch (error) {
      console.error("Error deleting chat session:", error)
      alert("Error al eliminar la consulta")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(sessionId, e as any)
    } else if (e.key === "Escape") {
      handleCancelEdit(e as any)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  // Formatear fecha de manera amigable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-ES", { 
        day: "numeric", 
        month: "short" 
      })
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity sm:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`
          fixed top-0 left-0 z-40 h-full w-72 
          bg-zinc-900 border-r border-zinc-700 flex flex-col
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          sm:static sm:translate-x-0 sm:z-auto
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white">RIZOTIPO</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNuevoChat}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm text-white rounded-lg font-medium flex items-center transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#F198C0" }}
              >
                <Plus className="w-4 h-4" />
                <span className="ml-1">{isLoading ? "..." : "Nuevo"}</span>
              </button>
              <button
                onClick={onClose}
                className="sm:hidden text-white hover:bg-zinc-800 p-1.5 rounded-lg transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar consultas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 rounded-lg 
               focus:outline-none focus:ring-1 focus:ring-[#F198C0] focus:border-[#F198C0] transition-all duration-200"
            />
          </div>
        </div>

        {/* Consultas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Consultas ({filteredSessions.length})
            </h2>
          </div>

          {filteredSessions.length > 0 ? (
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    chatSessionId === session.id
                      ? "text-white"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                  style={chatSessionId === session.id ? { backgroundColor: "#F198C0" } : {}}
                  onClick={() => handleSelectChat(session)}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, session.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-zinc-700 border border-zinc-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F198C0]"
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        {session.last_message && (
                          <p className="text-xs text-zinc-400 truncate mt-1">
                            {session.last_message}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">
                          {formatDate(session.updated_at)}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingSessionId === session.id ? (
                      <>
                        <button
                          onClick={(e) => handleSaveEdit(session.id, e)}
                          className="p-1 text-green-400 hover:bg-zinc-700 rounded transition-colors"
                          title="Guardar"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-400 hover:bg-zinc-700 rounded transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            chatSessionId === session.id
                              ? "bg-zinc-800 text-white"
                              : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {session.message_count}
                        </span>
                        <button
                          onClick={(e) => handleStartEdit(session, e)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Editar consulta"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar consulta"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">
                {searchQuery ? "No se encontraron consultas" : "No hay consultas todavía"}
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                {!searchQuery && "Crea tu primera consulta haciendo clic en 'Nuevo'"}
              </p>
            </div>
          )}
        </div>

        {/* User */}
        <div className="p-4 border-t border-zinc-700">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full text-white flex items-center justify-center font-medium"
                style={{ backgroundColor: "#F198C0" }}
              >
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "Usuario"}</p>
                <p className="text-xs text-zinc-400 truncate">{user?.email || ""}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-zinc-300 hover:text-white hover:bg-zinc-700 p-2 rounded transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}