from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.diagnostic.models import DiagnosticRequest, DiagnosticResponse
from app.diagnostic.controllers import create_diagnostic_controller
from app.core.database import collection_diagnostics
from app.auth.routes import get_current_user

router = APIRouter()


# ===== Crear diagnóstico =====
@router.post("/", response_model=DiagnosticResponse)
async def create_diagnostic(diagnostic: DiagnosticRequest, user=Depends(get_current_user)):
    print("Received diagnostic request:", diagnostic)
    print("Authenticated user:", user)
    result = await create_diagnostic_controller(diagnostic, str(user["_id"]))
    print("Created diagnostic result:", result)
    return result


# ===== Obtener diagnóstico por ID =====
@router.get("/{diagnostic_id}", response_model=DiagnosticResponse)
async def get_diagnostic(diagnostic_id: str, user=Depends(get_current_user)):
    diagnostic = await collection_diagnostics.find_one({
        "_id": ObjectId(diagnostic_id),
        "professional_id": ObjectId(user["_id"])
    })

    if not diagnostic:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")

    return DiagnosticResponse(
        id=str(diagnostic["_id"]),
        professional_id=str(diagnostic["professional_id"]),
        nombre=diagnostic["nombre"],
        whatsapp=diagnostic["whatsapp"],
        correo=diagnostic["correo"],
        plasticidad=diagnostic["plasticidad"],
        permeabilidad=diagnostic["permeabilidad"],
        densidad=diagnostic["densidad"],
        porosidad=diagnostic["porosidad"],
        oleosidad=diagnostic["oleosidad"],
        grosor=diagnostic["grosor"],
        textura=diagnostic["textura"],
        notas=diagnostic.get("notas"),
        created_at=diagnostic["created_at"],
        resultado_agente=diagnostic.get("resultado_agente")
    )

# ===== Get all diagnostics for the authenticated professional =====
@router.get("/", response_model=list[DiagnosticResponse])
async def get_all_diagnostics(user=Depends(get_current_user)):
    diagnostics_cursor = collection_diagnostics.find({
        "professional_id": ObjectId(user["_id"])
    })

    diagnostics = await diagnostics_cursor.to_list(length=None)

    if not diagnostics:
        raise HTTPException(status_code=404, detail="No se encontraron diagnósticos para este profesional")

    return [
        DiagnosticResponse(
            id=str(d["_id"]),
            professional_id=str(d["professional_id"]),
            nombre=d["nombre"],
            whatsapp=d["whatsapp"],
            correo=d["correo"],
            plasticidad=d["plasticidad"],
            permeabilidad=d["permeabilidad"],
            densidad=d["densidad"],
            porosidad=d["porosidad"],
            oleosidad=d["oleosidad"],
            grosor=d["grosor"],
            textura=d["textura"],
            notas=d.get("notas"),
            created_at=d["created_at"],
            resultado_agente=d.get("resultado_agente")
        )
        for d in diagnostics
    ]

