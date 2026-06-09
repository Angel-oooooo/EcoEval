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