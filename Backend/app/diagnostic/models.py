from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class DiagnosticRequest(BaseModel):
    nombre: str
    whatsapp: str
    correo: EmailStr
    plasticidad: str
    permeabilidad: str
    densidad: str
    porosidad: str
    oleosidad: str
    grosor: str
    textura: str
    notas: Optional[str] = None


class DiagnosticResponse(DiagnosticRequest):
    id: str
    professional_id: str
    created_at: datetime
    resultado_agente: Optional[str] = None
