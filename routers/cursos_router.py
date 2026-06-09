from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import obtener_usuario_actual
import models
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter(prefix="/cursos", tags=["Cursos"])

class CursoCrear(BaseModel):
    titulo: str
    descripcion: Optional[str] = ""
    objetivo: Optional[str] = ""
    material_texto: Optional[str] = ""
    duracion_horas: Optional[int] = 1
    porcentaje_aprobatorio: Optional[int] = 70

class AsignacionCrear(BaseModel):
    curso_id: int
    usuario_id: int
    fecha_limite: Optional[str] = None

@router.post("/")
def crear_curso(
    curso: CursoCrear,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para crear cursos")

    nuevo = models.Curso(
        titulo=curso.titulo,
        descripcion=curso.descripcion,
        objetivo=curso.objetivo,
        material_texto=curso.material_texto,
        duracion_horas=curso.duracion_horas,
        porcentaje_aprobatorio=curso.porcentaje_aprobatorio,
        creado_por=usuario_actual.id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Curso creado exitosamente", "id": nuevo.id}

@router.get("/")
def listar_cursos(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    cursos = db.query(models.Curso).filter(models.Curso.activo == True).all()
    return cursos

@router.post("/asignar")
def asignar_curso(
    asignacion: AsignacionCrear,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para asignar cursos")

    fecha_limite = None
    if asignacion.fecha_limite:
        fecha_limite = datetime.datetime.strptime(asignacion.fecha_limite, "%Y-%m-%d")

    nueva = models.AsignacionCurso(
        curso_id=asignacion.curso_id,
        usuario_id=asignacion.usuario_id,
        fecha_limite=fecha_limite
    )
    db.add(nueva)
    db.commit()
    return {"mensaje": "Curso asignado exitosamente"}

@router.get("/mis-cursos")
def mis_cursos(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    asignaciones = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.usuario_id == usuario_actual.id
    ).all()
    return asignaciones