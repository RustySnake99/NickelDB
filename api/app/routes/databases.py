from os.path import dirname, exists
from os import makedirs
from uuid import uuid4
from fastapi import APIRouter, UploadFile, HTTPException
import httpx
from pydantic import BaseModel

p = dirname(__file__)
router = APIRouter(prefix="/databases")
DATABASE_DIR = f"{p}/../../../databases"
RUST_ENGINE_URL = "http://127.0.0.1:9000"

class QueryRequest(BaseModel):
    sql: str

@router.post("/upload")
async def upload_database(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing Database filename!")
    if not file.filename.lower().endswith((".db", ".sqlite", ".sqlite3")):
        raise HTTPException(status_code=400, detail="File is not an SQLite database!")

    database_id = str(uuid4())
    database_dir = f"{DATABASE_DIR}/{database_id}"
    makedirs(database_dir)

    database_path = f"{database_dir}/database.db"
    with open(database_path, "wb") as output:
        while chunk := await file.read(1024 * 1024):
            output.write(chunk)

    return {"id": database_id, "filename": file.filename}

@router.get("/{database_id}/tables")
async def get_tables(database_id: str):
    database_path = f"{DATABASE_DIR}/{database_id}/database.db"
    if not exists(database_path):
        raise HTTPException(status_code=400, detail="Database not found!")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{RUST_ENGINE_URL}/tables", params={"path": database_path})
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Intenal Error occurred!")

    return response.json()

@router.post("/{database_id}/query")
async def execute_query(database_id: str, request: QueryRequest):
    database_path = f"{DATABASE_DIR}/{database_id}/database.db"
    if not exists(database_path):
        raise HTTPException(status_code=404, detail="Database not found....")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{RUST_ENGINE_URL}/query", params={"path": database_path, "sql": request.sql})
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=response.text)

    return response.json()