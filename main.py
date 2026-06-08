from fastapi import FastAPI
from database import engine, Base
import models
import routers.auth_router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoEval - Sistema de Capacitación ISO 14001")

app.include_router(auth_router.router)

@app.get("/")
def raiz():
    return {"mensaje": "aa funcionando correctamente ✅"}