import React, { useState, useRef, useEffect } from "react";

interface ChatAreaProps {
  activeChat: string;
  chatSessionId: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  avatar?: string;
}

export function ChatArea({ activeChat, chatSessionId }: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Función para obtener el token
  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // Generar ID único para mensajes
  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: generateMessageId(),
      sender: "user",
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: "TU",
    };

    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch("https://longest-project-connectors-molecular.trycloudflare.com/agent/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentMessage,
          // Si tu backend no necesita chat_session_id, puedes quitarlo
          chat_session_id: chatSessionId || "default_session"
        })
      });

      if (response.ok) {
        const data = await response.json();
        const agentMessage: Message = {
          id: generateMessageId(),
          sender: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          avatar: "RT",
        };
        setMessages(prev => [...prev, agentMessage]);
      } else if (response.status === 401) {
        throw new Error("Token inválido o expirado");
      } else {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: generateMessageId(),
        sender: "assistant",
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.",
        timestamp: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: "RT",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // El input solo se deshabilita durante la carga
  const isInputDisabled = isLoading;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-900 to-black text-white min-h-0">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-700 bg-zinc-900/90">
        <h2 className="font-semibold text-white text-lg">
          {activeChat || "Chat con el Agente"}
        </h2>
        <p className="text-sm text-green-400 mt-1">
        </p>
      </div>

      {/* Messages Area - Contenedor con scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-br from-zinc-900 to-black min-h-0"
      >
        {messages.length === 0 ? (
          <div className="text-center text-zinc-400 mt-8">
            <div className="w-16 h-16 rounded-full bg-zinc-800/60 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-lg text-white">
              ¡Hola! Soy tu asistente virtual
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              Escribe tu primer mensaje abajo para comenzar la conversación
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "assistant" && (
                <div 
                  className="flex-shrink-0 h-10 w-10 rounded-full text-white flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: "#F198C0" }}
                >
                  {msg.avatar}
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                  msg.sender === "user"
                    ? "text-white"
                    : "bg-zinc-800 text-white"
                }`}
                style={msg.sender === "user" ? { 
                  backgroundColor: "#F198C0"
                } : {}}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.sender === "user" ? "text-white/70" : "text-zinc-400"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
              {msg.sender === "user" && (
                <div
                  className="flex-shrink-0 h-10 w-10 rounded-full text-white flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: "#F198C0" }}
                >
                  {msg.avatar}
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div 
              className="flex-shrink-0 h-10 w-10 rounded-full text-white flex items-center justify-center text-sm font-medium"
              style={{ backgroundColor: "#F198C0" }}
            >
              RT
            </div>
            <div className="bg-zinc-800 text-white px-4 py-3 rounded-xl">
              <div className="flex gap-1">
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "#F198C0" }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce" 
                  style={{ backgroundColor: "#F198C0", animationDelay: "0.1s" }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce" 
                  style={{ backgroundColor: "#F198C0", animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-700 bg-zinc-900/90">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe tu mensaje aquí..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isInputDisabled}
            className="flex-1 bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 rounded-lg px-4 py-3 
              focus:outline-none focus:ring-1 focus:ring-[#F198C0] focus:border-[#F198C0] disabled:opacity-50
              transition-all duration-200"
          />

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isInputDisabled}
            className="text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
              hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "#F198C0"
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12 19 7-7 3 3-7 7-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}