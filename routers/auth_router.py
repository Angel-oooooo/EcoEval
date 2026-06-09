from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import verificar_contrasena, crear_token, hashear_contrasena, obtener_usuario_actual
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Esquema para crear usuario
class UsuarioCrear(BaseModel):
    nombre: str
    apellido: str
    correo: str
    contrasena: str
    rol: str = "empleado"
    puesto: str = ""

@router.post("/registro")
def registrar_usuario(usuario: UsuarioCrear, db: Session = Depends(get_db)):
    # Verificar si el correo ya existe
    existe = db.query(models.Usuario).filter(
        models.Usuario.correo == usuario.correo
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    nuevo = models.Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        contrasena_hash=hashear_contrasena(usuario.contrasena),
        rol=usuario.rol,
        puesto=usuario.puesto
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Usuario creado exitosamente", "id": nuevo.id}

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.correo == form_data.username
    ).first()

    if not usuario or not verificar_contrasena(form_data.password, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )

    token = crear_token({"sub": usuario.correo, "rol": usuario.rol})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "puesto": usuario.puesto
        }
    }

@router.get("/me")
def obtener_mi_perfil(
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return {
        "id": usuario_actual.id,
        "nombre": usuario_actual.nombre,
        "apellido": usuario_actual.apellido,
        "correo": usuario_actual.correo,
        "rol": usuario_actual.rol,
        "puesto": usuario_actual.puesto
    }