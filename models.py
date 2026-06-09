from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String)
    usuarios = relationship("Usuario", back_populates="area")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    correo = Column(String, unique=True, nullable=False)
    contrasena_hash = Column(String, nullable=False)
    rol = Column(String, default="empleado")  # admin, instructor, empleado
    puesto = Column(String)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    area = relationship("Area", back_populates="usuarios")

class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(String)
    objetivo = Column(String)
    material_texto = Column(String)
    duracion_horas = Column(Integer, default=1)
    porcentaje_aprobatorio = Column(Integer, default=70)
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    activo = Column(Boolean, default=True)
    asignaciones = relationship("AsignacionCurso", back_populates="curso")

class AsignacionCurso(Base):
    __tablename__ = "asignaciones_curso"

    id = Column(Integer, primary_key=True, index=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_asignacion = Column(DateTime, default=datetime.datetime.utcnow)
    fecha_limite = Column(DateTime, nullable=True)
    estado = Column(String, default="pendiente")  # pendiente, en_progreso, completado, vencido
    curso = relationship("Curso", back_populates="asignaciones")
    usuario = relationship("Usuario")

class Examen(Base):
    __tablename__ = "examenes"

    id = Column(Integer, primary_key=True, index=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    titulo = Column(String, nullable=False)
    instrucciones = Column(String)
    intentos_permitidos = Column(Integer, default=1)
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    preguntas = relationship("Pregunta", back_populates="examen")

class Pregunta(Base):
    __tablename__ = "preguntas"

    id = Column(Integer, primary_key=True, index=True)
    examen_id = Column(Integer, ForeignKey("examenes.id"))
    texto_pregunta = Column(String, nullable=False)
    orden = Column(Integer, default=1)
    examen = relationship("Examen", back_populates="preguntas")
    opciones = relationship("OpcionRespuesta", back_populates="pregunta")

class OpcionRespuesta(Base):
    __tablename__ = "opciones_respuesta"

    id = Column(Integer, primary_key=True, index=True)
    pregunta_id = Column(Integer, ForeignKey("preguntas.id"))
    texto_opcion = Column(String, nullable=False)
    es_correcta = Column(Boolean, default=False)
    pregunta = relationship("Pregunta", back_populates="opciones")

class ResultadoExamen(Base):
    __tablename__ = "resultados_examen"

    id = Column(Integer, primary_key=True, index=True)
    examen_id = Column(Integer, ForeignKey("examenes.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    puntuacion = Column(Integer, default=0)
    aprobado = Column(Boolean, default=False)
    fecha_inicio = Column(DateTime, default=datetime.datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)
    intento_numero = Column(Integer, default=1)
    respuestas = relationship("RespuestaUsuario", back_populates="resultado")

class RespuestaUsuario(Base):
    __tablename__ = "respuestas_usuario"

    id = Column(Integer, primary_key=True, index=True)
    resultado_id = Column(Integer, ForeignKey("resultados_examen.id"))
    pregunta_id = Column(Integer, ForeignKey("preguntas.id"))
    opcion_seleccionada_id = Column(Integer, ForeignKey("opciones_respuesta.id"))
    resultado = relationship("ResultadoExamen", back_populates="respuestas")