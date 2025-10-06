from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_NAME", "RizoTipoOnline")

if not uri:
    raise RuntimeError("MONGODB_URI no está definida en .env")

client = AsyncIOMotorClient(uri)
db = client[db_name]

collection_professionals = db["professionals"]
collection_clients = db["clients"]
collection_diagnostics = db["diagnostics"]
collection_chats = db["chat_sessions"]


def connect_to_mongo():
    return client