"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { API_BASE_URL } from "../../types/config"

interface Diagnostico {
  id: string
  nombre: string
  correo: string
  whatsapp: string
  plasticidad: string
  permeabilidad: string
  densidad: string
  porosidad: string
  oleosidad: string
  grosor: string
  textura: string
  notas?: string
  resultado_agente?: string 
}

interface SeccionRecomendacion {
  titulo: string
  contenido: string[]
}

interface SeccionJSON {
  titulo: string
  contenido: string[]
}

interface ResultadoAgenteJSON {
  secciones: {
    A: SeccionJSON
    B: SeccionJSON
    C: SeccionJSON
    D: SeccionJSON
    E: SeccionJSON
  }
}

export default function DiagnosticResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Diagnostico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [secciones, setSecciones] = useState<SeccionRecomendacion[]>([])

  // Función para manejar token expirado
  const handleTokenExpired = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  };

  // Función para verificar si la respuesta indica token expirado
  const checkTokenExpired = (response: Response) => {
    if (response.status === 401) {
      handleTokenExpired();
      return true;
    }
    return false;
  };

  // Función para obtener el token con verificación
  const getToken = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      handleTokenExpired();
    }
    return token;
  };

  useEffect(() => {
    const fetchDiagnostic = async () => {
      if (!id) return
      
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/diagnostics/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          setData(result)
          
          // Procesar el resultado del agente si existe
          if (result.resultado_agente) {
            const seccionesProcesadas = parsearResultadoAgente(result.resultado_agente)
            setSecciones(seccionesProcesadas)
          }
        } else {
          // Verificar si el token expiró
          if (checkTokenExpired(response)) {
            return;
          }
          throw new Error("Error cargando diagnóstico")
        }
      } catch (err) {
        console.error("Error cargando diagnóstico:", err)
        // Verificar si es error de token expirado
        if (err instanceof Error && err.message.includes("401")) {
          handleTokenExpired();
          return;
        }
        alert("Error al cargar el diagnóstico")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiagnostic()
  }, [id])

  // Función para parsear el resultado del agente (JSON o texto)
  const parsearResultadoAgente = (texto: string): SeccionRecomendacion[] => {
    try {
      // Intentar parsear como JSON primero
      const resultadoJSON: ResultadoAgenteJSON = JSON.parse(texto)
      
      // Mapear las secciones del JSON a SeccionRecomendacion
      const seccionesOrdenadas = [
        { key: 'A' },
        { key: 'B' },
        { key: 'C' },
        { key: 'D' },
        { key: 'E' }
      ]

      return seccionesOrdenadas.map(({ key }) => {
        const seccion = resultadoJSON.secciones[key as keyof typeof resultadoJSON.secciones]
        return {
          titulo: seccion.titulo,
          contenido: seccion.contenido
        }
      }).filter(seccion => seccion.contenido && seccion.contenido.length > 0)

    } catch (error) {
      // Si no es JSON válido, usar el método antiguo de parsing por texto
      console.log("No es JSON, usando parsing por texto")
      return parsearResultadoTexto(texto)
    }
  }

  // Función para parsear resultado en formato texto (fallback)
  const parsearResultadoTexto = (texto: string): SeccionRecomendacion[] => {
    const secciones: SeccionRecomendacion[] = []
    
    if (texto.includes("**") || texto.includes("#") || texto.match(/[A-Z][A-Z\s]+:/)) {
      const lineas = texto.split('\n').filter(linea => linea.trim())
      let seccionActual: SeccionRecomendacion | null = null
      
      for (const linea of lineas) {
        const lineaTrim = linea.trim()
        const esTitulo = lineaTrim.match(/^(?:\*\*|#|\d+\.\s+|[A-Z][A-Z\s]+\s*:)/)
        
        if (esTitulo) {
          if (seccionActual && seccionActual.contenido.length > 0) {
            secciones.push(seccionActual)
          }
          
          const tituloLimpio = lineaTrim
            .replace(/\*\*/g, '')
            .replace(/^#\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/:$/, '')
            .trim()
          
          seccionActual = {
            titulo: tituloLimpio,
            contenido: []
          }
        } else if (seccionActual && lineaTrim) {
          seccionActual.contenido.push(lineaTrim)
        }
      }
      
      if (seccionActual && seccionActual.contenido.length > 0) {
        secciones.push(seccionActual)
      }
    }
    
    if (secciones.length === 0) {
      const lineas = texto.split('\n').filter(linea => linea.trim())
      secciones.push({
        titulo: "Recomendaciones del Especialista",
        contenido: lineas
      })
    }
    
    return secciones
  }

  const handleVolverInicio = () => {
    navigate("/chat-center")
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderColor: "#F198C0" }}
        ></div>
        <p className="text-white text-lg">Cargando diagnóstico...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-lg">No se pudo cargar el diagnóstico</p>
        <Button
          onClick={handleVolverInicio}
          className="mt-4 text-white"
          style={{ backgroundColor: "#F198C0" }}
        >
          Volver al Chat Center
        </Button>
      </div>
    </div>
  )

  // 🔹 Si quieres mostrar los valores normalizados, descomenta el siguiente bloque y el Card de resultados del diagnóstico.
  /*
  const normalizarValor = (valor: string, tipo: string): string => {
    if (!valor) return "";
    const valorLower = valor.toLowerCase().trim();

    switch (tipo) {
      case "plasticidad":
      case "permeabilidad":
      case "porosidad":
      case "oleosidad":
        if (["sí", "si", "alta", "high"].includes(valorLower)) return "Alta";
        if (["no", "baja", "low"].includes(valorLower)) return "Baja";
        break;
      case "densidad":
        if (valorLower === "poca") return "Poca";
        if (valorLower === "media") return "Media";
        if (valorLower === "mucha") return "Mucha";
        break;
      case "grosor":
        if (valorLower === "delgada") return "Delgada";
        if (valorLower === "media") return "Media";
        if (valorLower === "gruesa") return "Gruesa";
        break;
      case "textura":
        if (valorLower === "ondulado") return "Ondulado";
        if (valorLower === "rizado") return "Rizado";
        if (valorLower === "afro") return "Afro";
        break;
      default:
        break;
    }
    return valor;
  }

  const datosNormalizados = {
    plasticidad: normalizarValor(data.plasticidad, "plasticidad"),
    permeabilidad: normalizarValor(data.permeabilidad, "permeabilidad"),
    densidad: normalizarValor(data.densidad, "densidad"),
    porosidad: normalizarValor(data.porosidad, "porosidad"),
    oleosidad: normalizarValor(data.oleosidad, "oleosidad"),
    grosor: normalizarValor(data.grosor, "grosor"),
    textura: normalizarValor(data.textura, "textura")
  }
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            Tu Diagnóstico RizoTipo
          </h1>
          <p className="text-zinc-400 text-lg">
            Resultados personalizados para {data.nombre}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Datos del cliente */}
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-xl">
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-600">
                  <p className="text-zinc-300 font-medium mb-1">Nombre</p>
                  <p className="text-white font-semibold">{data.nombre}</p>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-600">
                  <p className="text-zinc-300 font-medium mb-1">Email</p>
                  <p className="text-white font-semibold">{data.correo}</p>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-600">
                  <p className="text-zinc-300 font-medium mb-1">WhatsApp</p>
                  <p className="text-white font-semibold">{data.whatsapp}</p>
                </div>
              </div>
              {data.notas && (
                <div className="mt-4 bg-zinc-800 p-3 rounded-lg border border-zinc-600">
                  <p className="text-zinc-300 font-medium mb-1">Notas adicionales</p>
                  <p className="text-white">{data.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados del diagnóstico */}
          {/* <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-xl">
                Resultados del Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Plasticidad", value: datosNormalizados.plasticidad, tipo: "plasticidad" },
                  { label: "Permeabilidad", value: datosNormalizados.permeabilidad, tipo: "permeabilidad" },
                  { label: "Densidad", value: datosNormalizados.densidad, tipo: "densidad" },
                  { label: "Porosidad", value: datosNormalizados.porosidad, tipo: "porosidad" },
                  { label: "Oleosidad", value: datosNormalizados.oleosidad, tipo: "oleosidad" },
                  { label: "Grosor", value: datosNormalizados.grosor, tipo: "grosor" },
                  { label: "Textura", value: datosNormalizados.textura, tipo: "textura" },
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-600 transition-all duration-200 hover:border-zinc-500"
                  >
                    <p className="text-zinc-300 text-sm font-medium mb-2">{item.label}</p>
                    <p className="text-white font-bold text-lg">
                      {item.value}
                    </p>
                    <p className="text-zinc-400 text-xs mt-1 capitalize">
                      {item.tipo}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}

          {/* Resultado del Agente IA - Organizado en secciones */}
          {secciones.length > 0 && (
            <Card className="bg-zinc-900 border border-zinc-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-xl">
                  Plan de Cuidado Personalizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {secciones.map((seccion, index) => (
                    <div key={index} className="bg-zinc-800 border border-zinc-600 rounded-lg p-4">
                      <div className="mb-3">
                        <h3 className="text-white font-semibold text-lg" style={{ color: "#F198C0" }}>
                          {seccion.titulo}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        {seccion.contenido.map((linea, lineaIndex) => (
                          <div key={lineaIndex} className="text-white">
                            <span className="leading-relaxed text-sm">{linea}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback: Si no se pudo parsear pero hay resultado del agente */}
          {data.resultado_agente && secciones.length === 0 && (
            <Card className="bg-zinc-900 border border-zinc-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-xl">
                  Recomendaciones del Especialista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4">
                  <div className="text-white leading-relaxed whitespace-pre-wrap text-sm">
                    {data.resultado_agente}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer con botón */}
        <div className="text-center mt-8 pt-6 border-t border-zinc-700 space-y-4">
          <Button
            onClick={handleVolverInicio}
            className="text-white px-8 py-3 transition-all duration-300"
            style={{ backgroundColor: "#F198C0" }}
          >
            ← Volver al Chat Center
          </Button>
          <p className="text-zinc-400 text-sm">
            Gracias por confiar en RizoTipo para el cuidado de tus rizos
          </p>
        </div>
      </div>
    </div>
  )
}