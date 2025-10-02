from fastapi import APIRouter, HTTPException, Depends, Form, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import jwt, JWTError
from bson import ObjectId

from app.core.database import collection_professionals
from app.core.security import pwd_context, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.auth.models import ProfessionalCreate, ProfessionalResponse, TokenResponse

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        user = await collection_professionals.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# Registro estilista
@router.post("/register", response_model=ProfessionalResponse)
async def register(prof: ProfessionalCreate):
    exists = await collection_professionals.find_one({"email": prof.email})
    if exists:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    hashed_pw = pwd_context.hash(prof.password)
    new_prof = {
        "name": prof.name,
        "email": prof.email,
        "password_hash": hashed_pw,
        "whatsapp": prof.whatsapp,
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = await collection_professionals.insert_one(new_prof)
    return ProfessionalResponse(
        id=str(result.inserted_id),
        name=prof.name,
        email=prof.email,
        whatsapp=prof.whatsapp,
        is_active=True,
    )

# Login estilista
@router.post("/token", response_model=TokenResponse)
async def login(username: str = Form(...), password: str = Form(...)):
    user = await collection_professionals.find_one({"email": username.lower()})
    if not user or not pwd_context.verify(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(data={"sub": user["email"]}, expires_delta=access_token_expires)

    return TokenResponse(
        access_token=token,
        email=user["email"],
        name=user["name"],
    )

# Validar token
@router.get("/validate_token")
async def validate_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "exp": payload.get("exp")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
