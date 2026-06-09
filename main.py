from fastapi import FastAPI
from database import engine, Base
import models
import routers.auth_router as auth_router
import routers.cursos_router as cursos_router
import routers.examenes_router as examenes_router
import routers.dashboard_router as dashboard_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoEval - Sistema de Capacitación ISO 14001")

app.include_router(auth_router.router)
app.include_router(cursos_router.router)
app.include_router(examenes_router.router)
app.include_router(dashboard_router.router)

@app.get("/")
def raiz():
    return {"mensaje": "EcoEval funcionando correctamente ✅"}