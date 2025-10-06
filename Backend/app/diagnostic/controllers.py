import os
import json
from datetime import datetime
from fastapi import HTTPException
from dotenv import load_dotenv
from openai import AsyncOpenAI
from bson import ObjectId

from app.core.database import collection_diagnostics
from app.diagnostic.models import DiagnosticRequest, DiagnosticResponse
from app.diagnostic.prompts.diagnostic_prompt import RIZOTIPO_DIAGNOSTIC_PROMPT

# Configurar OpenAI
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def create_diagnostic_controller(diagnostic: DiagnosticRequest, professional_id: str) -> DiagnosticResponse:
    """
    Crea un diagnóstico: guarda en MongoDB y genera el resultado con OpenAI
    """
    # Guardar datos iniciales
    new_diag = {
        "professional_id": ObjectId(professional_id),
        "nombre": diagnostic.nombre,
        "whatsapp": diagnostic.whatsapp,
        "correo": diagnostic.correo,
        "plasticidad": diagnostic.plasticidad,
        "permeabilidad": diagnostic.permeabilidad,
        "densidad": diagnostic.densidad,
        "porosidad": diagnostic.porosidad,
        "oleosidad": diagnostic.oleosidad,
        "grosor": diagnostic.grosor,
        "textura": diagnostic.textura,
        "notas": diagnostic.notas,
        "created_at": datetime.utcnow(),
    }

    result = await collection_diagnostics.insert_one(new_diag)

    # Construir mensaje para OpenAI
    user_message = f"""
    Cliente: {diagnostic.nombre}
    WhatsApp: {diagnostic.whatsapp}
    Correo: {diagnostic.correo}

    Respuestas del diagnóstico:
    - Plasticidad: {diagnostic.plasticidad}
    - Permeabilidad: {diagnostic.permeabilidad}
    - Densidad: {diagnostic.densidad}
    - Porosidad: {diagnostic.porosidad}
    - Oleosidad: {diagnostic.oleosidad}
    - Grosor: {diagnostic.grosor}
    - Textura: {diagnostic.textura}

    Notas adicionales: {diagnostic.notas or "N/A"}

    **IMPORTANTE:** Genera SOLO un objeto JSON válido con la estructura del ejemplo, sin texto adicional.
    """

    try:
        # Enviar a OpenAI
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": RIZOTIPO_DIAGNOSTIC_PROMPT},
                {"role": "user", "content": user_message}
            ],
            max_tokens=800,
            temperature=0.7,
            response_format={"type": "json_object"}  # Esto fuerza a OpenAI a devolver JSON
        )
        
        resultado_agente = response.choices[0].message.content
        
        # Validar que sea JSON válido
        try:
            json.loads(resultado_agente)
        except json.JSONDecodeError:
            # Si no es JSON válido, crear uno manualmente con los datos
            resultado_agente = generar_json_fallback(diagnostic)

        # Guardar respuesta en la DB
        await collection_diagnostics.update_one(
            {"_id": result.inserted_id},
            {"$set": {"resultado_agente": resultado_agente}}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar diagnóstico: {str(e)}")

    # Retornar respuesta
    return DiagnosticResponse(
        id=str(result.inserted_id),
        professional_id=str(professional_id),
        **diagnostic.dict(),
        created_at=new_diag["created_at"],
        resultado_agente=resultado_agente
    )


def generar_json_fallback(diagnostic: DiagnosticRequest) -> str:
    """
    Genera un JSON de fallback si OpenAI no devuelve un JSON válido
    """
    # Determinar técnica de lavado basada en oleosidad
    oleosidad_lower = diagnostic.oleosidad.lower()
    if "alta" in oleosidad_lower or "rapido" in oleosidad_lower or "diario" in oleosidad_lower:
        tecnica_lavado = "Tecnica CO-POO"
        instrucciones_lavado = [
            "Acondicionador en medios y puntas",
            "Shampoo en raiz",
            "Enjuagar sin repetir acondicionador",
            "Frecuencia: diario o dia de por medio"
        ]
    else:
        tecnica_lavado = "Tecnica ASA"
        instrucciones_lavado = [
            "Aplicar acondicionante",
            "Shampoo en raiz dos veces", 
            "Acondicionador en medios y puntas",
            "Frecuencia: cada 3-4 dias"
        ]

    # Determinar tratamientos basados en plasticidad
    plasticidad_lower = diagnostic.plasticidad.lower()
    if "baja" in plasticidad_lower or "no" in plasticidad_lower:
        tratamientos_plasticidad = "Pre-lavado obligatorio: mascarilla + crema 3 en 1 + aceite + Leavein 15 min antes de lavar"
    else:
        tratamientos_plasticidad = "Mascarillas despues del shampoo, peinar 5-10 veces"

    # Determinar técnicas de definición basadas en textura
    textura_lower = diagnostic.textura.lower()
    if "ondulado" in textura_lower:
        definicion = "Praying hands + scrunch intensivo, Gel en dos momentos"
    elif "afro" in textura_lower:
        definicion = "Pre-lavado obligatorio, Definicion rizo a rizo con Leavein + gel, Mantener cabello muy mojado"
    else:
        definicion = "Definicion con cepillo por lineas, Rizo a rizo en coronilla y contornos"

    json_resultado = {
        "secciones": {
            "A": {
                "titulo": "Resultados del Diagnostico",
                "contenido": [
                    f"Plasticidad: {diagnostic.plasticidad}",
                    f"Permeabilidad: {diagnostic.permeabilidad}",
                    f"Densidad: {diagnostic.densidad}",
                    f"Porosidad: {diagnostic.porosidad}",
                    f"Oleosidad: {diagnostic.oleosidad}",
                    f"Grosor: {diagnostic.grosor}",
                    f"Textura: {diagnostic.textura}"
                ]
            },
            "B": {
                "titulo": "Recomendaciones de Lavado",
                "contenido": [
                    tecnica_lavado,
                    *instrucciones_lavado,
                    "Detox capilar mensual con shampoo Rizos Felices aplicado en cabello seco"
                ]
            },
            "C": {
                "titulo": "Tratamientos",
                "contenido": [
                    tratamientos_plasticidad,
                    "Lavado normal",
                    "Tratamientos nutritivos y fortalecedores"
                ]
            },
            "D": {
                "titulo": "Definicion y Styling",
                "contenido": [
                    definicion,
                    f"Usar productos adecuados para grosor {diagnostic.grosor}"
                ]
            },
            "E": {
                "titulo": "Cuidados Extra",
                "contenido": [
                    "Dormir con gorro de satin",
                    "Hacer pina o usar rizo protector durante la noche"
                ]
            }
        }
    }
    
    return json.dumps(json_resultado, ensure_ascii=False)