"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"

import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../../types/config"

const questions = [
  {
    key: "plasticidad",
    question: "¿Tu cabello tiene capacidad de formar fácilmente el rizo?",
    type: "yesno" as const,
    explanation: "Facilidad del rizo para formarse.",
    showExplanationOnNo: true
  },
  {
    key: "permeabilidad",
    question: "¿Tu cabello se moja fácilmente?",
    type: "yesno" as const,
    explanation: "Facilidad con la que el cabello absorbe agua.",
    showExplanationOnNo: true
  },
  {
    key: "densidad",
    question: "¿Cómo sientes la cantidad de cabello que tienes?",
    type: "options" as const,
    options: ["Poca", "Media", "Mucha"],
  },
  {
    key: "porosidad",
    question: "¿Tu cabello se satura fácilmente con productos o tiene procesos químicos?",
    type: "options" as const,
    options: ["Alta", "Baja"],
  },
  {
    key: "oleosidad",
    question: "¿Cada cuánto tiempo se engrasa tu cuero cabelludo?",
    type: "options" as const,
    options: [
      { display: "Mismo día o siguiente (alta)", value: "Alta" },
      { display: "Después de 3 días (baja)", value: "Baja" }
    ],
  },
  {
    key: "grosor",
    question: "¿Qué tan gruesa sientes tu hebra capilar?",
    type: "options" as const,
    options: ["Delgada", "Media", "Gruesa"],
  },
  {
    key: "textura",
    question: "¿Cuál es tu patrón de rizo?",
    type: "options" as const,
    options: ["Ondulado", "Rizado", "Afro"],
  },
]

// Función de validación de email más estricta
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

export default function DiagnosticForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<any>({
    nombre: "",
    whatsapp: "",
    correo: "",
    notas: "",
  })
  const [currentStep, setCurrentStep] = useState(-1)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

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

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value })
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[key]) {
      setErrors(prev => ({...prev, [key]: ""}))
    }
  }

  const validatePersonalData = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre completo es obligatorio"
    }
    
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "El WhatsApp es obligatorio"
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      newErrors.whatsapp = "Ingresa un número de WhatsApp válido con al menos 10 dígitos"
    }
    
    if (!formData.correo.trim()) {
      newErrors.correo = "El correo electrónico es obligatorio"
    } else if (!isValidEmail(formData.correo)) {
      newErrors.correo = "Ingresa un correo electrónico válido (ejemplo: nombre@dominio.com)"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === -1) {
      // Validar datos personales antes de continuar
      if (!validatePersonalData()) {
        return
      }
    }
    
    if (currentStep < questions.length - 1) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > -1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    // Validar que todas las preguntas estén respondidas
    const unansweredQuestions = questions.filter(q => !formData[q.key])
    if (unansweredQuestions.length > 0) {
      alert("Por favor responde todas las preguntas antes de generar el diagnóstico")
      return
    }

    // Validar datos personales nuevamente antes de enviar
    if (!validatePersonalData()) {
      alert("Por favor corrige los errores en los datos personales antes de enviar")
      return
    }

    setIsSubmitting(true)
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/diagnostics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        navigate(`/diagnostics/result/${data.id}`)
      } else {
        // Verificar si el token expiró
        if (checkTokenExpired(res)) {
          return;
        }
        const errorData = await res.json()
        throw new Error(errorData.detail || "Error creando diagnóstico")
      }
    } catch (err: any) {
      console.error(err)
      // Verificar si es error de token expirado
      if (err instanceof Error && err.message.includes("401")) {
        handleTokenExpired();
        return;
      }
      alert(err.message || "Hubo un error al guardar el diagnóstico")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVolverInicio = () => {
    setShowConfirmModal(true)
  }

  const confirmSalir = () => {
    navigate("/chat-center")
  }

  const cancelarSalir = () => {
    setShowConfirmModal(false)
  }

  const progress = ((currentStep + 1) / (questions.length)) * 100
  const currentQuestion = currentStep >= 0 ? questions[currentStep] : null

  // Función para determinar si mostrar la explicación
  const shouldShowExplanation = () => {
    if (!currentQuestion) return false

    // Para plasticidad y permeabilidad, mostrar explicación solo cuando la respuesta es "No"
    if (currentQuestion.showExplanationOnNo) {
      return formData[currentQuestion.key] === "No"
    }

    // Para las demás preguntas, siempre mostrar la explicación
    return true
  }

  // Función para verificar si se puede avanzar
  const canProceed = () => {
    if (currentStep === -1) {
      return formData.nombre.trim() && 
             formData.whatsapp.trim() && 
             formData.correo.trim() &&
             isValidEmail(formData.correo) &&
             !errors.nombre &&
             !errors.whatsapp &&
             !errors.correo
    }
    return formData[currentQuestion?.key || ""]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Diagnóstico RizoTipo
          </h1>
          <p className="text-zinc-400">
            Descubre el cuidado perfecto para tus rizos
          </p>

          {/* Botón Volver al Inicio */}
          <Button
            onClick={handleVolverInicio}
            variant="outline"
            className="mt-4 border-zinc-600 text-white bg-zinc-900 hover:bg-[#F198C0] hover:text-white active:bg-[#F198C0] active:text-white transition-colors"
          >
            ← Volver al Inicio
          </Button>
        </div>

        <Card className="w-full bg-zinc-900 border border-zinc-700">
          <CardHeader className="border-b border-zinc-700 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">
                {currentStep === -1 ? "Datos Personales" : `Pregunta ${currentStep + 1} de ${questions.length}`}
              </CardTitle>
              <span className="text-sm text-zinc-400">
                {Math.round(progress)}% completado
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "#F198C0"
                }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6 mt-6 p-6">
            {/* Datos personales */}
            {currentStep === -1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    Nombre completo *
                  </Label>
                  <input
                    type="text"
                    className={`w-full bg-zinc-800 border text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:border-[#F198C0] transition-colors ${
                      errors.nombre ? "border-red-500 focus:ring-red-500" : "border-zinc-600 focus:ring-[#F198C0]"
                    }`}
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    placeholder="Ingresa tu nombre completo"
                    required
                  />
                  {errors.nombre && (
                    <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    WhatsApp * <span className="text-zinc-400 text-xs">(incluye el prefijo)</span>
                  </Label>
                  <input
                    type="tel"
                    className={`w-full bg-zinc-800 border text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:border-[#F198C0] transition-colors ${
                      errors.whatsapp ? "border-red-500 focus:ring-red-500" : "border-zinc-600 focus:ring-[#F198C0]"
                    }`}
                    value={formData.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    placeholder="Ej: +57 3001234567"
                    required
                  />
                  {errors.whatsapp && (
                    <p className="text-red-400 text-sm mt-1">{errors.whatsapp}</p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    Correo electrónico *
                  </Label>
                  <input
                    type="email"
                    className={`w-full bg-zinc-800 border text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:border-[#F198C0] transition-colors ${
                      errors.correo ? "border-red-500 focus:ring-red-500" : "border-zinc-600 focus:ring-[#F198C0]"
                    }`}
                    value={formData.correo}
                    onChange={(e) => handleChange("correo", e.target.value)}
                    onBlur={() => {
                      if (formData.correo && !isValidEmail(formData.correo)) {
                        setErrors(prev => ({...prev, correo: "Ingresa un correo electrónico válido (ejemplo: nombre@dominio.com)"}))
                      }
                    }}
                    placeholder="ejemplo@correo.com"
                    required
                  />
                  {errors.correo && (
                    <p className="text-red-400 text-sm mt-1">{errors.correo}</p>
                  )}
                  {!errors.correo && formData.correo && !isValidEmail(formData.correo) && (
                    <p className="text-yellow-400 text-sm mt-1">Verifica que el correo sea válido</p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                    Notas adicionales (opcional)
                  </Label>
                  <textarea
                    className="w-full bg-zinc-800 border border-zinc-600 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F198C0] focus:border-[#F198C0] transition-colors resize-none"
                    value={formData.notas}
                    onChange={(e) => handleChange("notas", e.target.value)}
                    placeholder="Alguna observación adicional sobre el cabello..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Preguntas RizoTipo */}
            {currentStep >= 0 && currentQuestion && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white text-lg font-semibold mb-3 block">
                    {currentQuestion.question}
                  </Label>

                  {/* Mostrar explicación condicionalmente */}
                  {currentQuestion.explanation && shouldShowExplanation() && (
                    <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "#F198C0" }}
                        >
                        </div>
                        <div>
                          <p className="text-zinc-300 text-sm leading-relaxed">
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {currentQuestion.type === "yesno" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Sí", "No"].map((option) => (
                      <Button
                        key={option}
                        variant={formData[currentQuestion.key] === option ? "default" : "outline"}
                        onClick={() => handleChange(currentQuestion.key, option)}
                        className={`h-14 text-base font-medium transition-all ${formData[currentQuestion.key] === option
                          ? "text-white border-transparent"
                          : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                          }`}
                        style={formData[currentQuestion.key] === option ? {
                          backgroundColor: "#F198C0"
                        } : {}}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  currentQuestion.options && (
                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion.options.map((option: any) => {
                        // Para oleosidad, option es un objeto {display, value}
                        // Para otras preguntas, option es un string
                        const displayText = typeof option === 'object' ? option.display : option
                        const value = typeof option === 'object' ? option.value : option
                        
                        return (
                          <Button
                            key={value}
                            variant={formData[currentQuestion.key] === value ? "default" : "outline"}
                            onClick={() => handleChange(currentQuestion.key, value)}
                            className={`h-14 text-base font-medium transition-all ${formData[currentQuestion.key] === value
                              ? "text-white border-transparent"
                              : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                              }`}
                            style={formData[currentQuestion.key] === value ? {
                              backgroundColor: "#F198C0"
                            } : {}}
                          >
                            {displayText}
                          </Button>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Navegación */}
            <div className="flex justify-between pt-6 border-t border-zinc-700">
              <Button
                onClick={handlePrev}
                disabled={currentStep === -1}
                className={`
                border border-zinc-600 text-white bg-zinc-900
                hover:bg-[#F198C0] hover:text-white
                active:bg-[#F198C0] active:text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-300
              `}
              >
                ← Anterior
              </Button>

              {currentStep < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#F198C0" }}
                >
                  {currentStep === -1 ? "Comenzar Diagnóstico" : "Siguiente →"}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData[currentQuestion?.key || ""] || isSubmitting}
                  className={`
                  mt-4 px-8 flex items-center gap-2 border border-zinc-600 
                  text-white bg-zinc-900 
                  hover:bg-[#F198C0] hover:text-white
                  active:bg-[#F198C0] active:text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-300
                `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar Diagnóstico"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-3">
                ¿Estás seguro de que quieres salir?
              </h3>
              <p className="text-zinc-300 mb-6">
                Estás en medio de un diagnóstico. Si sales ahora, perderás todo el progreso.
              </p>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={cancelarSalir}
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmSalir}
                  className="text-white px-6"
                  style={{ backgroundColor: "#F198C0" }}
                >
                  Sí, salir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}