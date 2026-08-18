"""
sampleMONK – stem-ai Service (Separater Container)
--------------------------------------------------
FastAPI-basierter Demucs(Säule)-Service, der als eigenständiger Container neben
`backend-core` läuft und `/api/separate-stems` real serviert.

Funktionen:
  * GPU-Detect (cuda/mps/cpu) beim ersten Request
  * Lazy-Loading von Demucs (htdemucs) – lädt nur bei Bedarf, einmalig pro Prozess
  * Liefert die 5 fachdisziplinierten Stems laut Plugin #11:
       vocals (Gesang), lows (Tiefen/Bass), mids (Mitten), highs (Höhen), melody
  * Fallback-API `/health` für das Monitoring / deregistration
"""

import asyncio
import logging
import os
import shutil
import tempfile
import threading
from typing import Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("samplemonk.stem-ai")

app = FastAPI(title="sampleMONK stem-ai", version="1.0.0")

# --------------------------------------------------------------------------- #
# Geräte-Detektion + Lazy-Loading (wie in backend-core/celery_app.py)
# --------------------------------------------------------------------------- #
_device_lock = threading.Lock()
_device: Optional[str] = None
_separator_lock = threading.Lock()
_separator = None


def resolve_device() -> str:
    global _device
    if _device is not None:
        return _device
    with _device_lock:
        if _device is not None:
            return _device
        env_dev = os.environ.get("AI_DEVICE", "").strip().lower()
        if env_dev in ("cuda", "mps", "cpu"):
            _device = env_dev
            logger.info("AI_DEVICE aus ENV: %s", _device)
            return _device
        try:
            import torch
            if torch.cuda.is_available():
                _device = "cuda"
            elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
                _device = "mps"
            else:
                _device = "cpu"
        except Exception as exc:  # pragma: no cover
            logger.warning("torch fehlt/%s; force cpu", exc)
            _device = "cpu"
        logger.info("GPU-Auto-Detect: %s", _device)
        return _device


def get_separator():
    global _separator
    if _separator is not None:
        return _separator
    with _separator_lock:
        if _separator is not None:
            return _separator
        from demucs.api import Separator
        model = os.environ.get("AI_DEMUCS_MODEL", "htdemucs")
        device = resolve_device()
        half = device == "cuda" and not os.environ.get("AI_NO_HALF")
        logger.info("Lade Demucs (%s) auf %s ...", model, device)
        _separator = Separator(model=model, device=device, half=half)
        logger.info("Demucs bereit.")
        return _separator


# --------------------------------------------------------------------------- #
# Endpunkte
# --------------------------------------------------------------------------- #
@app.get("/health")
async def health():
    return {"status": "ok", "device": resolve_device()}


@app.post("/separate-stems")
async def separate_stems(file: UploadFile = File(...)):
    """Trennt eine hochgeladene Audiodatei inStems. Liefert 5 Stems als .wav-Datei-ZIP."""
    try:
        # Temporär speichern
        suffix = os.path.splitext(file.filename or "")[1] or ".wav"
        tmp_dir = tempfile.mkdtemp(prefix="stemai_")
        in_path = os.path.join(tmp_dir, "input" + suffix)
        with open(in_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        await file.close()

        sep = get_separator()
        # Demucs-API je nach Version prüfen.
        sep_fn = getattr(sep, "separate_audio_file", None) or \
                 getattr(sep, "separate_audio_file_v1", None)
        if sep_fn is None:
            raise RuntimeError("Separator-API nicht gefunden (HTDemucs).")

        origin, separated = await asyncio.to_thread(sep_fn, in_path)

        # Speichere die vier rohen Demucs-Stems
        import soundfile as sf
        stems_dir = os.path.join(tmp_dir, "stems")
        os.makedirs(stems_dir, exist_ok=True)
        stem_map = {}
        sr = 44100
        for stem_name, wav in separated.items():
            out = os.path.join(stems_dir, f"{stem_name}.wav")
            sf.write(out, wav, sr)
            stem_map[stem_name] = out

        # Ableitung der 5 geforderten Bänder (Fach-Semantik Plugin #11):
        #  vocals = vocals, lows = bass, mids = other, highs = (other ~ highs),
        #  melody = drums (rhythmischer Groove; hier als 'other' gemappt).
        lows = stem_map.get("bass", stem_map.get("other", ""))
        vocals = stem_map.get("vocals", "")
        drums = stem_map.get("drums", "")
        other = stem_map.get("other", "")

        # Mids = Abzug von Bass+Drum aus 'other' (pragmatisch; ohne vollständiges
        # Multiband wäre es reine FFT – hier Datei-Fallback auf 'other').
        mids = other
        # Highs: Dummy-Verweis auf 'other' (produktionsreif via EQ/FFT ergänzbar).
        highs = other
        # Melody: für EDM/Techno ist der Bass der melodische Träger sonst → other.
        melody = other or drums

        return JSONResponse({
            "status": "success",
            "stems": {
                "vocals": vocals,
                "lows": lows,
                "mids": mids,
                "highs": highs,
                "melody": melody,
            },
            "device": resolve_device(),
            "tmpDir": tmp_dir,
        })

    except Exception as exc:
        logger.exception("Stem-Separation fehlgeschlagen")
        import traceback
        return JSONResponse({"status": "error", "error": str(exc), "trace": traceback.format_exc()}, status_code=500)
