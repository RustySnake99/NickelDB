from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.databases import router as database_router

app = FastAPI()
app.include_router(database_router)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"message": "Hello from SQLite Web API."}