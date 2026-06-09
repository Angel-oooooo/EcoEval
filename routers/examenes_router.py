from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import obtener_usuario_actual
import models
from pydantic import BaseModel
from typing import List, Optional
import datetime

router = APIRouter(prefix="/examenes", tags=["Evaluaciones"])

# Esquemas
class OpcionCrear(BaseModel):
    texto_opcion: str
    es_correcta: bool = False

class PreguntaCrear(BaseModel):
    texto_pregunta: str
    orden: int = 1
    opciones: List[OpcionCrear]

class ExamenCrear(BaseModel):
    curso_id: int
    titulo: str
    instrucciones: Optional[str] = ""
    intentos_permitidos: int = 1
    preguntas: List[PreguntaCrear]

class RespuestaEnviar(BaseModel):
    pregunta_id: int
    opcion_seleccionada_id: int

class EnvioExamen(BaseModel):
    examen_id: int
    respuestas: List[RespuestaEnviar]

# Endpoints
@router.get("/")
def listar_examenes(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    examenes = db.query(models.Examen).all()
    return [
        {
            "id": e.id,
            "titulo": e.titulo,
            "curso_id": e.curso_id,
            "curso": e.curso.titulo if e.curso else "N/A",
            "intentos_permitidos": e.intentos_permitidos,
            "total_preguntas": len(e.preguntas),
            "total_resultados": db.query(models.ResultadoExamen).filter(
                models.ResultadoExamen.examen_id == e.id
            ).count(),
        }
        for e in examenes
    ]

@router.post("/")
def crear_examen(
    examen: ExamenCrear,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    examen_existente = db.query(models.Examen).filter(
        models.Examen.curso_id == examen.curso_id
    ).first()
    if examen_existente:
        raise HTTPException(status_code=400, detail="Este curso ya tiene un examen asignado")

    nuevo_examen = models.Examen(
        curso_id=examen.curso_id,
        titulo=examen.titulo,
        instrucciones=examen.instrucciones,
        intentos_permitidos=examen.intentos_permitidos,
        creado_por=usuario_actual.id
    )
    db.add(nuevo_examen)
    db.commit()
    db.refresh(nuevo_examen)

    for p in examen.preguntas:
        nueva_pregunta = models.Pregunta(
            examen_id=nuevo_examen.id,
            texto_pregunta=p.texto_pregunta,
            orden=p.orden
        )
        db.add(nueva_pregunta)
        db.commit()
        db.refresh(nueva_pregunta)

        for o in p.opciones:
            nueva_opcion = models.OpcionRespuesta(
                pregunta_id=nueva_pregunta.id,
                texto_opcion=o.texto_opcion,
                es_correcta=o.es_correcta
            )
            db.add(nueva_opcion)

    db.commit()
    return {"mensaje": "Examen creado exitosamente", "id": nuevo_examen.id}

@router.get("/{examen_id}/detalle")
def obtener_examen_detalle(
    examen_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    examen = db.query(models.Examen).filter(models.Examen.id == examen_id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    return {
        "id": examen.id,
        "titulo": examen.titulo,
        "instrucciones": examen.instrucciones,
        "preguntas": [
            {
                "id": p.id,
                "texto_pregunta": p.texto_pregunta,
                "orden": p.orden,
                "opciones": [
                    {"id": o.id, "texto_opcion": o.texto_opcion, "es_correcta": o.es_correcta}
                    for o in p.opciones
                ]
            }
            for p in examen.preguntas
        ]
    }

@router.get("/{examen_id}")
def obtener_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    examen = db.query(models.Examen).filter(models.Examen.id == examen_id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    resultado = {
        "id": examen.id,
        "titulo": examen.titulo,
        "instrucciones": examen.instrucciones,
        "preguntas": []
    }

    for p in examen.preguntas:
        pregunta_data = {
            "id": p.id,
            "texto_pregunta": p.texto_pregunta,
            "orden": p.orden,
            "opciones": [
                {"id": o.id, "texto_opcion": o.texto_opcion}
                for o in p.opciones
            ]
        }
        resultado["preguntas"].append(pregunta_data)

    return resultado

@router.delete("/{examen_id}")
def eliminar_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    examen = db.query(models.Examen).filter(models.Examen.id == examen_id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    tiene_resultados = db.query(models.ResultadoExamen).filter(
        models.ResultadoExamen.examen_id == examen_id
    ).first()
    if tiene_resultados:
        raise HTTPException(status_code=400, detail="No se puede eliminar un examen que ya tiene respuestas registradas")

    db.delete(examen)
    db.commit()
    return {"mensaje": "Examen eliminado"}

@router.post("/responder")
def responder_examen(
    envio: EnvioExamen,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    examen = db.query(models.Examen).filter(models.Examen.id == envio.examen_id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    # Crear resultado
    resultado = models.ResultadoExamen(
        examen_id=envio.examen_id,
        usuario_id=usuario_actual.id,
        fecha_inicio=datetime.datetime.utcnow(),
        fecha_fin=datetime.datetime.utcnow()
    )
    db.add(resultado)
    db.commit()
    db.refresh(resultado)

    # Calificar respuestas
    correctas = 0
    total = len(envio.respuestas)

    for r in envio.respuestas:
        opcion = db.query(models.OpcionRespuesta).filter(
            models.OpcionRespuesta.id == r.opcion_seleccionada_id
        ).first()

        respuesta = models.RespuestaUsuario(
            resultado_id=resultado.id,
            pregunta_id=r.pregunta_id,
            opcion_seleccionada_id=r.opcion_seleccionada_id
        )
        db.add(respuesta)

        if opcion and opcion.es_correcta:
            correctas += 1

    # Calcular puntuación
    puntuacion = int((correctas / total) * 100) if total > 0 else 0
    aprobado = puntuacion >= examen.curso.porcentaje_aprobatorio if examen.curso else puntuacion >= 70

    resultado.puntuacion = puntuacion
    resultado.aprobado = aprobado

    if aprobado:
        asignacion = db.query(models.AsignacionCurso).filter(
            models.AsignacionCurso.usuario_id == usuario_actual.id,
            models.AsignacionCurso.curso_id == examen.curso_id
        ).first()
        if asignacion:
            asignacion.estado = "completado"

    db.commit()

    return {
        "mensaje": "Examen respondido",
        "puntuacion": puntuacion,
        "aprobado": aprobado,
        "correctas": correctas,
        "total": total
    }