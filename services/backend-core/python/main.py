from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
from celery_app import render_project_task, celery_app
from celery.result import AsyncResult

# ...

@app.get("/api/render-status/{task_id}")
async def get_render_status(task_id: str):
    res = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "status": res.status,
        "result": res.result
    }

import os

ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else [],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Base URLs for services defined in docker-compose.yml
SERVICES = {
    "stem": "http://stem-ai:8000",
    "voice": "http://voice-ai:8000",
    "dsp": "http://dsp-processor:8000",
    "seq": "http://sequencer-engine:8000",
    "master": "http://master-player:8000"
}

async def proxy_request(service_name: str, path: str, request: Request):
    async with httpx.AsyncClient() as client:
        url = f"{SERVICES[service_name]}{path}"
        data = await request.json()
        response = await client.post(url, json=data)
        return response.json()

@app.post("/api/separate-stems")
async def separate_stems(request: Request):
    return await proxy_request("stem", "/api/separate-stems", request)

@app.post("/api/generate-voice")
async def generate_voice(request: Request):
    return await proxy_request("voice", "/api/generate-voice", request)

@app.post("/api/apply-fx")
async def apply_fx(request: Request):
    return await proxy_request("dsp", "/api/apply-fx", request)

@app.post("/api/render")
async def render_project(request: Request):
    project_data = await request.json()
    # Trigger headless celery task
    task = render_project_task.delay(project_data)
    return {"task_id": task.id, "status": "Render started"}

@app.get("/")
async def root():
    return {"message": "Sample Monk Core Backend (Gateway) Operational"}
