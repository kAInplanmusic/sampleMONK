from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Sample Monk Core Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.post("/api/master-audio-control")
async def master_audio_control(request: Request):
    return await proxy_request("master", "/api/control", request)

@app.get("/")
async def root():
    return {"message": "Sample Monk Core Backend (Gateway) Operational"}
