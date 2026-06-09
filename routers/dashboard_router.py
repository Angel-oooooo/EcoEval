from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import obtener_usuario_actual
import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/resumen")
def resumen_general(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    total_empleados = db.query(models.Usuario).filter(
        models.Usuario.rol == "empleado",
        models.Usuario.activo == True
    ).count()

    total_cursos = db.query(models.Curso).filter(
        models.Curso.activo == True
    ).count()

    total_asignaciones = db.query(models.AsignacionCurso).count()

    completados = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.estado == "completado"
    ).count()

    pendientes = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.estado == "pendiente"
    ).count()

    vencidos = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.estado == "vencido"
    ).count()

    tasa_cumplimiento = 0
    if total_asignaciones > 0:
        tasa_cumplimiento = round((completados / total_asignaciones) * 100, 1)

    return {
        "total_empleados": total_empleados,
        "total_cursos": total_cursos,
        "total_asignaciones": total_asignaciones,
        "completados": completados,
        "pendientes": pendientes,
        "vencidos": vencidos,
        "tasa_cumplimiento": tasa_cumplimiento
    }

@router.get("/empleado/{usuario_id}")
def historial_empleado(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    empleado = db.query(models.Usuario).filter(
        models.Usuario.id == usuario_id
    ).first()

    asignaciones = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.usuario_id == usuario_id
    ).all()

    historial = []
    for a in asignaciones:
        resultado = db.query(models.ResultadoExamen).filter(
            models.ResultadoExamen.usuario_id == usuario_id
        ).first()

        historial.append({
            "curso": a.curso.titulo if a.curso else "N/A",
            "estado": a.estado,
            "fecha_asignacion": a.fecha_asignacion,
            "fecha_limite": a.fecha_limite,
            "puntuacion": resultado.puntuacion if resultado else None,
            "aprobado": resultado.aprobado if resultado else None
        })

    return {
        "empleado": f"{empleado.nombre} {empleado.apellido}" if empleado else "No encontrado",
        "historial": historial
    }

@router.get("/mis-resultados")
def mis_resultados(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    resultados = db.query(models.ResultadoExamen).filter(
        models.ResultadoExamen.usuario_id == usuario_actual.id
    ).all()

    return [
        {
            "examen_id": r.examen_id,
            "puntuacion": r.puntuacion,
            "aprobado": r.aprobado,
            "fecha": r.fecha_fin
        }
        for r in resultados
    ]
    