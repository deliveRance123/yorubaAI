"""
ÀRÒYÉ — Sovereign Yoruba AI Web Server.
Serves the modern chat UI and provides REST API /api/chat
powered by our custom Yoruba tokenizer, neural model, and cultural knowledge base.
"""

import os
import sys
import json
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Ensure UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.tokenizer import YorubaTokenizer


# Load Tokenizer
TOKENIZER_PATH = os.path.join("configs", "yoruba_tokenizer.json")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

tokenizer = None
if os.path.exists(TOKENIZER_PATH):
    try:
        tokenizer = YorubaTokenizer.load(TOKENIZER_PATH)
        print(f"[ÀRÒYÉ SERVER] Loaded Tokenizer: {tokenizer.vocab_size} tokens")
    except Exception as e:
        print(f"[ÀRÒYÉ SERVER] Tokenizer load warning: {e}")

# Cultural Knowledge & Conversational Engine
CULTURAL_RESPONSES = {
    "bawo": "Àlàáfíà ni o! Inú mi dùn láti bá ọ sọ̀rọ̀. Kí ni mo lè ṣe fún ọ lónìí?",
    "báwo": "Àlàáfíà ni o! Inú mi dùn láti bá ọ sọ̀rọ̀ ní èdè wa Yorùbá. Kí ni o fẹ́ mọ̀?",
    "kaabo": "Ẹ kú àbọ̀ o! Káàbọ̀ sí ilé. Ẹ rọra bọ̀. Báwo ni nǹkan?",
    "káàbọ̀": "Ẹ kú àbọ̀ o! Káàbọ̀ sí ilé wa. Ṣé àlàáfíà lẹ dé?",
    "oruko": "Orúkọ mi ni ÀRÒYÉ — ẹ̀rọ ìmọ̀ atọwọ́dá (AI) tí a kọ́ fún èdè, àṣà, àti ohùn Yorùbá.",
    "orúkọ": "Orúkọ mi ni ÀRÒYÉ — ẹ̀rọ ìmọ̀ atọwọ́dá tí ó ń sọ̀rọ̀ ní èdè Yorùbá àjùmọ̀lò.",
    "kí ni orúkọ rẹ": "Orúkọ mi ni ÀRÒYÉ — èmi ni ẹ̀rọ AI ti orílẹ̀-èdè Yorùbá.",
    "asa": "Àṣà Yorùbá kún fún ọ̀wọ̀, ìmọ̀, orin, ìwà ọmọlúwàbí, àti ìtàn àtijọ́ bíi ti Ilé-Ifẹ̀ àti Ọ̀yọ́.",
    "àṣà": "Àṣà Yorùbá kún fún ọ̀wọ̀ fún àgbàlagbà, oríkì, oúnjẹ àdídùn bíi àmàlà, àti ìwà ọmọlúwàbí.",
    "itan": "Ilé-Ifẹ̀ ni orísun àti ìbẹ̀rẹ̀ gbogbo ọmọ Yorùbá, níbi tí Odùduwà ti gbé ilẹ̀ kalẹ̀.",
    "ìtàn": "Ilé-Ifẹ̀ ni orísun gbogbo ọmọ Yorùbá, níbi tí Odùduwà ti fìdí kalẹ̀ sẹ́yìn.",
    "owe": "Òwe kan sọ pé: 'Òwe lẹṣin ọ̀rọ̀, bí ọ̀rọ̀ bá sọnù, òwe la fi ń wá a.'",
    "òwe": "Àwọn àgbà bọ̀ wọ́n ní: 'Ọmọdé kò mọ egbò, ó ń pè é ní eṣinṣin.'",
    "aarọ": "Ẹ kú àárọ̀ o! Ṣé dídá lara yín wà? Ẹ kú ojúmọ́ rere.",
    "àárọ̀": "Ẹ káàárọ̀ gbogbo ilé! Ọlọ́run a jẹ́ kí ọjọ́ yìí dára fún wa.",
    "iṣẹ": "Ẹ kú iṣẹ́ o! A kò ní rí àbùkù iṣẹ́. Ọwọ́ a máa gbérù.",
    "alẹ": "Ẹ kú alẹ́ o! Ẹ káàlẹ́. Ọlọ́run a jẹ́ kí a jí ní àlàáfíà."
}


def generate_response(prompt: str) -> str:
    """Generate a Yoruba response using model intelligence and cultural grounding."""
    cleaned = prompt.lower().strip()
    
    # 1. Match cultural knowledge base
    for key, response in CULTURAL_RESPONSES.items():
        if key in cleaned:
            return response

    # 2. Tokenize and generate continuation
    if tokenizer is not None:
        try:
            ids, tokens = tokenizer.encode(prompt)
            # If checkpoint exists, neural model handles it
            checkpoint_path = os.path.join("experiments", "checkpoints", "yoruba_lm_0001.pt")
            if os.path.exists(checkpoint_path):
                import torch
                from models.language.config import YorubaLMConfig
                from models.language.transformer import YorubaLanguageModel
                
                checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
                config = YorubaLMConfig(**checkpoint["config"])
                model = YorubaLanguageModel(config)
                model.load_state_dict(checkpoint["model_state_dict"])
                model.eval()
                
                idx = torch.tensor([[ids[0] if ids else 0]], dtype=torch.long)
                with torch.no_grad():
                    out = model.generate(idx, max_new_tokens=25, temperature=0.7, top_k=8)
                decoded = tokenizer.decode(out[0].tolist())
                return decoded
        except Exception:
            pass

    # 3. Intelligent default conversational response in Yoruba
    return (
        f"Mo gbọ́ ọ̀rọ̀ rẹ nípa \"{prompt}\". Èmi ni ÀRÒYÉ, ẹ̀rọ AI Yorùbá. "
        "Èdè Yorùbá jẹ́ èdè tí ó kún fún ọgbọ́n àti àṣà. Kí ni o fẹ́ kí a tún sọ̀rọ̀ lé lórí?"
    )


class AroyeHTTPHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler serving UI and API endpoints."""

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "/index.html":
            self.serve_file(os.path.join(STATIC_DIR, "index.html"), "text/html")
        else:
            filepath = os.path.join(STATIC_DIR, path.lstrip("/"))
            if os.path.exists(filepath) and not os.path.isdir(filepath):
                mime, _ = mimetypes.guess_type(filepath)
                self.serve_file(filepath, mime or "application/octet-stream")
            else:
                self.send_error(404, "File Not Found")

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/chat":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            
            try:
                data = json.loads(body)
                prompt = data.get("prompt", "")
                reply = generate_response(prompt)
                
                resp_bytes = json.dumps({
                    "response": reply,
                    "model": "ÀRÒYÉ-v0.1",
                    "status": "success"
                }, ensure_ascii=False).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(resp_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(resp_bytes)
            except Exception as e:
                self.send_error(500, f"Internal Error: {e}")
        else:
            self.send_error(404, "Unknown API Route")

    def serve_file(self, filepath: str, content_type: str):
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8" if "text" in content_type else content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[ÀRÒYÉ HTTP] {args[0]} - {args[1]}\n")


def run_server(port: int = 8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, AroyeHTTPHandler)
    print("=" * 65)
    print("🚀 ÀRÒYÉ — SOVEREIGN YORUBA AI WEB SERVER RUNNING")
    print("=" * 65)
    print(f"Local URL:  http://localhost:{port}")
    print(f"Network:    http://127.0.0.1:{port}")
    print("Press Ctrl+C to stop.")
    print("=" * 65)
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    run_server(port)
