from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import obtener_usuario_actual
import models
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
import io
import datetime

router = APIRouter(prefix="/reportes", tags=["Reportes PDF"])

@router.get("/empleado/{usuario_id}")
def reporte_empleado(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    empleado = db.query(models.Usuario).filter(
        models.Usuario.id == usuario_id
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    asignaciones = db.query(models.AsignacionCurso).filter(
        models.AsignacionCurso.usuario_id == usuario_id
    ).all()

    # Crear PDF en memoria
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elementos = []
    styles = getSampleStyleSheet()

    # Título
    titulo_style = ParagraphStyle(
        'Titulo',
        parent=styles['Title'],
        fontSize=16,
        textColor=colors.HexColor('#1a5276'),
        spaceAfter=12
    )
    elementos.append(Paragraph("EcoEval — Sistema de Gestión de Capacitación Ambiental", titulo_style))
    elementos.append(Paragraph("Reporte Individual de Cumplimiento ISO 14001", styles['Heading2']))
    elementos.append(Spacer(1, 0.2 * inch))

    # Datos del empleado
    elementos.append(Paragraph(f"<b>Empleado:</b> {empleado.nombre} {empleado.apellido}", styles['Normal']))
    elementos.append(Paragraph(f"<b>Correo:</b> {empleado.correo}", styles['Normal']))
    elementos.append(Paragraph(f"<b>Puesto:</b> {empleado.puesto or 'No especificado'}", styles['Normal']))
    elementos.append(Paragraph(f"<b>Fecha de generación:</b> {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elementos.append(Spacer(1, 0.3 * inch))

    # Tabla de cursos
    elementos.append(Paragraph("Historial de Capacitación", styles['Heading3']))
    elementos.append(Spacer(1, 0.1 * inch))

    encabezados = ['Curso', 'Estado', 'Fecha Límite', 'Calificación', '¿Aprobado?']
    filas = [encabezados]

    for a in asignaciones:
        resultado = db.query(models.ResultadoExamen).filter(
            models.ResultadoExamen.usuario_id == usuario_id
        ).first()

        fecha_limite = a.fecha_limite.strftime('%d/%m/%Y') if a.fecha_limite else 'Sin fecha'
        puntuacion = f"{resultado.puntuacion}%" if resultado else 'No presentado'
        aprobado = 'Sí ✓' if (resultado and resultado.aprobado) else 'No'
        curso_titulo = a.curso.titulo if a.curso else 'N/A'

        filas.append([curso_titulo, a.estado.capitalize(), fecha_limite, puntuacion, aprobado])

    if len(filas) == 1:
        filas.append(['Sin cursos asignados', '-', '-', '-', '-'])

    tabla = Table(filas, colWidths=[2.5*inch, 1*inch, 1.2*inch, 1*inch, 0.9*inch])
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5276')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#d6eaf8')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    elementos.append(tabla)
    elementos.append(Spacer(1, 0.4 * inch))

    # Firma
    elementos.append(Paragraph("_______________________________", styles['Normal']))
    elementos.append(Paragraph("Firma del Responsable de Capacitación", styles['Normal']))
    elementos.append(Spacer(1, 0.1 * inch))
    elementos.append(Paragraph(
        "Este documento es generado automáticamente por EcoEval como evidencia de cumplimiento conforme a la cláusula 7.2 y 7.3 de la norma ISO 14001.",
        styles['Italic']
    ))

    doc.build(elementos)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reporte_{empleado.nombre}_{empleado.apellido}.pdf"
        }
    )