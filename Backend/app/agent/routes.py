from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.agent.controllers import chat_with_openai

router = APIRouter(prefix="/agent", tags=["Agent"])

class ChatRequest(BaseModel):
    message: str


# 🔹 Endpoint normal (devuelve todo junto)
@router.post("/chat")
async def chat_endpoint(data: ChatRequest):
    response = await chat_with_openai(data.message)
    return {"response": response}       


# # 🔹 Endpoint streaming (va devolviendo tokens en vivo)
# @router.post("/chat/stream")
# async def chat_stream_endpoint(data: ChatRequest):
#     async def event_generator():
#         async for chunk in chat_with_openai_stream(data.message):
#             yield chunk
#     return StreamingResponse(event_generator(), media_type="text/plain")
