from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import conversations, health_records
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Health Logging AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(health_records.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
