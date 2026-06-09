from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from dotenv import load_dotenv
import models
import routers.auth_router as auth_router
import routers.cursos_router as cursos_router
import routers.examenes_router as examenes_router
import routers.dashboard_router as dashboard_router
import routers.reportes_router as reportes_router
import routers.usuarios_router as usuarios_router
import os

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoEval - Sistema de Capacitación ISO 14001")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(cursos_router.router)
app.include_router(examenes_router.router)
app.include_router(dashboard_router.router)
app.include_router(reportes_router.router)
app.include_router(usuarios_router.router)

@app.get("/")
def raiz():
    return {"mensaje": "EcoEval funcionando correctamente ✅"}