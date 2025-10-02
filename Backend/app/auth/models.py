from pydantic import BaseModel, EmailStr
from typing import Optional

class ProfessionalCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    whatsapp: Optional[str] = None

class ProfessionalResponse(BaseModel):
    id: str
    name: str
    email: str
    whatsapp: Optional[str]
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    name: str
