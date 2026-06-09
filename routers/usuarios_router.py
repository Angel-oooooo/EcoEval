from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import obtener_usuario_actual
import models
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

class UsuarioEditar(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    puesto: Optional[str] = None
    rol: Optional[str] = None

@router.get("/")
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    usuarios = db.query(models.Usuario).filter(models.Usuario.activo == True).all()
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "correo": u.correo,
            "rol": u.rol,
            "puesto": u.puesto,
            "area_id": u.area_id
        }
        for u in usuarios
    ]

@router.get("/{usuario_id}")
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo,
        "rol": usuario.rol,
        "puesto": usuario.puesto,
        "area_id": usuario.area_id
    }

@router.put("/{usuario_id}")
def editar_usuario(
    usuario_id: int,
    data: UsuarioEditar,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.nombre is not None: usuario.nombre = data.nombre
    if data.apellido is not None: usuario.apellido = data.apellido
    if data.puesto is not None: usuario.puesto = data.puesto
    if data.rol is not None: usuario.rol = data.rol

    db.commit()
    return {"mensaje": "Usuario actualizado"}

@router.delete("/{usuario_id}")
def desactivar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.activo = False
    db.commit()
    return {"mensaje": "Usuario desactivado"}
