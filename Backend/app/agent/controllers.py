import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from app.agent.prompts.system_prompt import SYSTEM_PROMPT_SHORT
from app.core.database import collection_chats
from app.agent.models import ChatSession, Message, PyObjectId
from datetime import datetime
from bson import ObjectId
from typing import List, Dict, Any

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

async def chat_with_openai(message: str, chat_history: List[Dict[str, Any]] = None) -> str:
    """
    Envía un mensaje a OpenAI con historial de conversación
    """
    # Construir mensajes con historial
    messages = [{"role": "system", "content": SYSTEM_PROMPT_SHORT}]
    
    # Agregar historial si existe
    if chat_history:
        for msg in chat_history[-10:]:  # Últimos 10 mensajes para contexto
            # Usar acceso por clave en lugar de atributo
            messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Agregar mensaje actual
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=512,
        temperature=0.7,
    )
    return response.choices[0].message.content

async def save_chat_message(chat_session_id: str, role: str, content: str):
    """
    Guarda un mensaje en la sesión de chat
    """
    message = {
        "role": role, 
        "content": content,
        "timestamp": datetime.utcnow()
    }
    
    await collection_chats.update_one(
        {"_id": ObjectId(chat_session_id)},
        {
            "$push": {"messages": message},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

async def create_chat_session(professional_id: str, title: str) -> str:
    """
    Crea una nueva sesión de chat
    """
    chat_session = {
        "professional_id": ObjectId(professional_id),
        "title": title,
        "messages": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection_chats.insert_one(chat_session)
    return str(result.inserted_id)

async def get_chat_sessions(professional_id: str):
    """
    Obtiene todas las sesiones de chat de un profesional
    """
    cursor = collection_chats.find(
        {"professional_id": ObjectId(professional_id)}
    ).sort("updated_at", -1)
    
    sessions = []
    async for doc in cursor:
        last_message = doc["messages"][-1]["content"] if doc["messages"] else None
        sessions.append({
            "id": str(doc["_id"]),
            "title": doc["title"],
            "message_count": len(doc["messages"]),
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"],
            "last_message": last_message
        })
    
    return sessions

async def get_chat_session(chat_session_id: str, professional_id: str):
    """
    Obtiene una sesión de chat específica con todos sus mensajes
    """
    session = await collection_chats.find_one({
        "_id": ObjectId(chat_session_id),
        "professional_id": ObjectId(professional_id)
    })
    
    if not session:
        return None
    
    return session

async def delete_chat_session(chat_session_id: str, professional_id: str):
    """
    Elimina una sesión de chat
    """
    result = await collection_chats.delete_one({
        "_id": ObjectId(chat_session_id),
        "professional_id": ObjectId(professional_id)
    })
    
    return result.deleted_count > 0