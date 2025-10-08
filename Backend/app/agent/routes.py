from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.agent.controllers import (
    chat_with_openai,
    save_chat_message,
    create_chat_session,
    get_chat_session,
    delete_chat_session
)
from app.auth.routes import get_current_user
from bson import ObjectId
import json

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


# 🔹 Enviar mensaje (crea sesión si no existe, guarda historial y recuerda últimos 10)
@router.post("/chat")
async def chat_endpoint(data: ChatRequest, user=Depends(get_current_user)):
    professional_id = str(user["_id"])

    # Buscar si ya existe una sesión para este profesional
    session = await get_chat_session_by_professional(professional_id)

    # Si no existe, crear una
    if not session:
        session_id = await create_chat_session(professional_id, title="Chat principal")
        session = await get_chat_session(session_id, professional_id)
    else:
        session_id = str(session["_id"])

    # Tomar últimos 10 mensajes para memoria
    chat_history = session.get("messages", [])[-10:]

    # Guardar mensaje del usuario
    await save_chat_message(session_id, "user", data.message)

    # Obtener respuesta con memoria
    response_text = await chat_with_openai(data.message, chat_history)

    # Guardar respuesta del asistente
    await save_chat_message(session_id, "assistant", response_text)

    return {"session_id": session_id, "response": response_text}


# 🔹 Obtener la sesión actual del profesional (con mensajes)
@router.get("/session")
async def get_session(user=Depends(get_current_user)):
    professional_id = str(user["_id"])
    session = await get_chat_session_by_professional(professional_id)

    if not session:
        raise HTTPException(status_code=404, detail="No hay sesión activa para este usuario")

    # Convertir ObjectId a string para serialización JSON
    session["_id"] = str(session["_id"])
    session["professional_id"] = str(session["professional_id"])
    
    # Convertir ObjectId en mensajes si existen
    if "messages" in session:
        for message in session["messages"]:
            if "_id" in message:
                message["_id"] = str(message["_id"])
    
    return session


# 🔹 Eliminar la sesión del profesional
@router.delete("/session")
async def delete_session(user=Depends(get_current_user)):
    professional_id = str(user["_id"])
    session = await get_chat_session_by_professional(professional_id)

    if not session:
        raise HTTPException(status_code=404, detail="No hay sesión para eliminar")

    deleted = await delete_chat_session(str(session["_id"]), professional_id)
    if not deleted:
        raise HTTPException(status_code=400, detail="Error al eliminar la sesión")

    return {"message": "Sesión eliminada correctamente"}


# 🔹 Función auxiliar interna
async def get_chat_session_by_professional(professional_id: str):
    """
    Devuelve la única sesión asociada a un profesional, si existe.
    """
    from app.core.database import collection_chats
    return await collection_chats.find_one({"professional_id": ObjectId(professional_id)})