import os
import json
import httpx
import asyncio

class HyperSonicMOA:
    def __init__(self, gemini_key: str, hf_token: str, deepseek_key: str = None):
        self.gemini_key = gemini_key
        self.hf_token = hf_token
        self.deepseek_key = deepseek_key
        self.client = httpx.AsyncClient(timeout=60.0)

    async def call_gemini(self, prompt: str, context: str = "") -> str:
        if not self.gemini_key:
            return "Gemini API Key is not configured."
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        payload = {"contents": [{"parts": [{"text": f"{prompt}\n\nContext: {context}"}]}]}
        try:
            response = await self.client.post(url, json=payload)
            if response.status_code == 200:
                result = response.json()
                return result['candidates'][0]['content']['parts'][0]['text']
            return f"Gemini Error {response.status_code}: {response.text}"
        except Exception as e:
            return f"Gemini Call Failed: {str(e)}"

    async def call_deepseek(self, prompt: str) -> str:
        if not self.deepseek_key:
            # Fallback to Gemini if no DeepSeek key is provided
            print("DeepSeek key missing, falling back to Gemini for Phase 2 (DSP Reasoning).")
            return await self.call_gemini(f"Analyze the DSP logic and mathematical modeling for: {prompt}")
            
        headers = {
            "Authorization": f"Bearer {self.deepseek_key}", 
            "Content-Type": "application/json"
        }
        payload = {
            "model": "deepseek-reasoner",
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            response = await self.client.post("https://api.deepseek.com/v1/chat/completions", json=payload, headers=headers)
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            return f"DeepSeek Error {response.status_code}: {response.text}"
        except Exception as e:
            return f"DeepSeek Call Failed: {str(e)}"

    async def call_huggingface(self, prompt: str, model: str = "meta-llama/Llama-3.1-70B-Instruct") -> str:
        if not self.hf_token:
            return "Hugging Face Token is not configured."
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        url = f"https://api-inference.huggingface.co/models/{model}"
        try:
            response = await self.client.post(url, json={"inputs": prompt}, headers=headers)
            if response.status_code == 200:
                res_data = response.json()
                if isinstance(res_data, list) and len(res_data) > 0:
                    return res_data[0].get('generated_text', '')
                return str(res_data)
            return f"Hugging Face Error {response.status_code}: {response.text}"
        except Exception as e:
            return f"Hugging Face Call Failed: {str(e)}"

    async def run_pipeline(self, report_text: str) -> str:
        print("🚀 Phase 1: Historische Extraktion (Gemini)...")
        raw_structure = await self.call_gemini("Extrahiere Hardware-Specs und Chip-Architekturen.", report_text)
        
        print("⚙️ Phase 2: DSP-Logik & Code-Validierung (DeepSeek-R1 / Fallback)...")
        dsp_logic = await self.call_deepseek(f"Erstelle mathematische Modelle und diskrete Differenzengleichungen fuer diese Hardware-Spezifikationen: {raw_structure}")
        
        print("🎨 Phase 3: UX & Tone-Mapping (Llama-3.1 @ Hugging Face)...")
        ui_design = await self.call_huggingface(f"Erstelle vereinfachte UI-Regler (Kombination von Drehreglern, Schiebereglern oder Tasten) fuer diese DSP-Modellierungslogik: {dsp_logic}")
        
        print("💎 Phase 4: Final Validation & JSON Assembly (Gemini Pro)...")
        final_prompt = """
        Fasse alles in ein High-End JSON-Modul zusammen.
        Es MUSS exakt die folgende Struktur als valides JSON-Objekt (nicht Array, sondern ein einzelnes Objekt) haben, ohne markdown code-blocks:
        {
          "id": "generiert_id_kleingeschrieben",
          "name": "Echter Name des Geräts",
          "kategorie": "Synth" oder "Drum" oder "Sampler" oder "Modular" oder "Effekt" oder "Dynamics" oder "Sequenzer",
          "core_prinzip": "Ultrakurze Zusammenfassung des Klangprinzips (max. 15 Wörter)",
          "controls": [
            { "name": "Parameter1", "type": "Drehregler" oder "Schieberegler" oder "Taste", "description": "Kurze Beschreibung des Parameters" },
            { "name": "Parameter2", "type": "Drehregler" oder "Schieberegler" oder "Taste", "description": "Kurze Beschreibung des Parameters" },
            { "name": "Parameter3", "type": "Drehregler" oder "Schieberegler" oder "Taste", "description": "Kurze Beschreibung des Parameters" }
          ],
          "user_friendly_score": 1 bis 10 (int),
          "kosten": "$" oder "$$" oder "$$$",
          "nutzen": "Klangcharakterbeschreibung",
          "nachbau_idee": "Komplexe Nachbau-Idee und DSP-Details",
          "technische_details": "Technische Details wie Originale Chips, Schaltungsaufbau"
        }
        Input 1 (Raw Specs): """ + raw_structure + """
        Input 2 (DSP Logic): """ + dsp_logic + """
        Input 3 (UI Design): """ + ui_design + """
        Gib NUR das reine valide JSON-Objekt aus! Keine zusätzlichen Erklärungen!
        """
        final_module = await self.call_gemini(final_prompt)
        
        # Clean potential markdown JSON wrappers
        cleaned = final_module.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()

    async def close(self):
        await self.client.aclose()
