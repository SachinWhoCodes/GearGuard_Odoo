from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.router import api_router
from app.db.init_db import init_demo_data

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
)

# CORS
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.on_event("startup")
def on_startup():
    # Note: migrations are handled by start.sh in Docker.
    # This only seeds demo users if enabled.
    init_demo_data()
