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

class CursoEditar(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    objetivo: Optional[str] = None
    material_texto: Optional[str] = None
    duracion_horas: Optional[int] = None
    porcentaje_aprobatorio: Optional[int] = None

class AsignacionCrear(BaseModel):
    curso_id: int
    usuario_id: int
    fecha_limite: Optional[str] = None

@router.get("/")
def listar_cursos(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    cursos = db.query(models.Curso).filter(models.Curso.activo == True).all()
    return [
        {
            "id": c.id,
            "titulo": c.titulo,
            "descripcion": c.descripcion,
            "objetivo": c.objetivo,
            "duracion_horas": c.duracion_horas,
            "porcentaje_aprobatorio": c.porcentaje_aprobatorio,
            "material_texto": c.material_texto,
        }
        for c in cursos
    ]

# mis-cursos ANTES de /{curso_id} para que FastAPI no lo confunda
@router.get("/mis-cursos")
def mis_cursos(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    asignaciones = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.usuario_id == usuario_actual.id
    ).all()

    resultado = []
    for a in asignaciones:
        examen = db.query(models.Examen).filter(
            models.Examen.curso_id == a.curso_id
        ).first()

        resultado_examen = None
        if examen:
            resultado_examen = db.query(models.ResultadoExamen).filter(
                models.ResultadoExamen.usuario_id == usuario_actual.id,
                models.ResultadoExamen.examen_id == examen.id
            ).order_by(models.ResultadoExamen.intento_numero.desc()).first()

        resultado.append({
            "asignacion_id": a.id,
            "curso_id": a.curso_id,
            "curso": a.curso.titulo if a.curso else "N/A",
            "descripcion": a.curso.descripcion if a.curso else "",
            "material_texto": a.curso.material_texto if a.curso else "",
            "estado": a.estado,
            "fecha_asignacion": a.fecha_asignacion,
            "fecha_limite": a.fecha_limite,
            "examen_id": examen.id if examen else None,
            "intentos_permitidos": examen.intentos_permitidos if examen else None,
            "puntuacion": resultado_examen.puntuacion if resultado_examen else None,
            "aprobado": resultado_examen.aprobado if resultado_examen else None,
            "intento_numero": resultado_examen.intento_numero if resultado_examen else 0,
        })

    return resultado

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

@router.get("/{curso_id}")
def obtener_curso(
    curso_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    curso = db.query(models.Curso).filter(
        models.Curso.id == curso_id,
        models.Curso.activo == True
    ).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso

@router.put("/{curso_id}")
def editar_curso(
    curso_id: int,
    data: CursoEditar,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    if data.titulo is not None: curso.titulo = data.titulo
    if data.descripcion is not None: curso.descripcion = data.descripcion
    if data.objetivo is not None: curso.objetivo = data.objetivo
    if data.material_texto is not None: curso.material_texto = data.material_texto
    if data.duracion_horas is not None: curso.duracion_horas = data.duracion_horas
    if data.porcentaje_aprobatorio is not None: curso.porcentaje_aprobatorio = data.porcentaje_aprobatorio

    db.commit()
    return {"mensaje": "Curso actualizado"}

@router.delete("/{curso_id}")
def desactivar_curso(
    curso_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    curso.activo = False
    db.commit()
    return {"mensaje": "Curso desactivado"}
