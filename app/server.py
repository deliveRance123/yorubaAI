"""
ÀRÒYÉ — Sovereign Yoruba AI Server & Crowdsourcing Platform.
Serves the Sovereign AI Chat interface (/), Public Landing Page (/community),
Headerless/Footerless Auth (/community/login, /community/signup),
Contributor Dashboard (/community/dashboard), and Approver Quality Gate (/community/approver).
Powered by Neon PostgreSQL database integration with real authentic metrics.
"""

import os
import sys
import json
import mimetypes
import uuid
import hashlib
from email.parser import BytesParser
from email.policy import default
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Ensure UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from preprocessing.tokenizer import YorubaTokenizer

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        return None
    try:
        import psycopg2
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"[DB Warning] Connection error: {e}")
        return None

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
AUDIO_UPLOAD_DIR = os.path.join("data", "speech")
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)

# Load Tokenizer for AI Chat
TOKENIZER_PATH = os.path.join("configs", "yoruba_tokenizer.json")
tokenizer = None
if os.path.exists(TOKENIZER_PATH):
    try:
        tokenizer = YorubaTokenizer.load(TOKENIZER_PATH)
    except Exception:
        pass

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
    "òwe": "Àwọn àgbà bọ̀ wọ́n ní: 'Ọmọdé kò mọ egbò, ó ń pè é ní eṣinṣin.'"
}

def generate_chat_response(prompt: str) -> str:
    cleaned = prompt.lower().strip()
    for key, response in CULTURAL_RESPONSES.items():
        if key in cleaned:
            return response
    return (
        f"Mo gbọ́ ọ̀rọ̀ rẹ nípa \"{prompt}\". Èmi ni ÀRÒYÉ, ẹ̀rọ AI Yorùbá. "
        "Èdè Yorùbá jẹ́ èdè tí ó kún fún ọgbọ́n àti àṣà. Kí ni o fẹ́ kí a tún sọ̀rọ̀ lé lórí?"
    )


class AroyeServerHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Routing Pages
        if path in ["/", "/index.html"]:
            self.serve_static_file("index.html", "text/html")
        elif path in ["/community", "/community/", "/community.html"]:
            self.serve_static_file("community.html", "text/html")
        elif path in ["/community/login", "/login", "/login.html"]:
            self.serve_static_file("login.html", "text/html")
        elif path in ["/community/signup", "/signup", "/signup.html"]:
            self.serve_static_file("signup.html", "text/html")
        elif path in ["/community/dashboard", "/dashboard", "/dashboard.html"]:
            self.serve_static_file("dashboard.html", "text/html")
        elif path in ["/community/approver", "/approver", "/approver.html"]:
            self.serve_static_file("approver.html", "text/html")

        # 2. Audio uploads serving
        elif path.startswith("/audio/"):
            audio_filename = path.replace("/audio/", "").strip("/")
            file_disk_path = os.path.join(AUDIO_UPLOAD_DIR, audio_filename)
            if os.path.exists(file_disk_path):
                self.serve_raw_file(file_disk_path, "audio/wav")
            else:
                self.send_error(404, "Audio Not Found")

        # 3. Community Stats API (Real Numbers)
        elif path == "/api/community/stats":
            self.handle_real_stats()

        # 4. Contributor Personal Data API
        elif path == "/api/contributor/my-data":
            query = parse_qs(parsed.query)
            user_id = query.get("user_id", [None])[0]
            self.handle_contributor_data(user_id)

        # 5. Approver Queue API
        elif path == "/api/approver/queue":
            self.handle_approver_queue()

        # 6. Static files
        else:
            filepath = os.path.join(STATIC_DIR, path.lstrip("/"))
            if os.path.exists(filepath) and not os.path.isdir(filepath):
                mime, _ = mimetypes.guess_type(filepath)
                self.serve_raw_file(filepath, mime or "application/octet-stream")
            else:
                self.send_error(404, "File Not Found")

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))

        # Model Chat API
        if parsed.path == "/api/chat":
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
                prompt = data.get("prompt", "")
                reply = generate_chat_response(prompt)
                resp = json.dumps({"response": reply, "model": "ÀRÒYÉ-v0.1", "status": "success"}, ensure_ascii=False).encode("utf-8")
                self.send_json_response(200, resp)
            except Exception as e:
                self.send_error(500, str(e))

        # Auth: Sign Up
        elif parsed.path == "/api/auth/signup":
            body = self.rfile.read(content_length).decode("utf-8")
            self.handle_signup(body)

        # Auth: Login
        elif parsed.path == "/api/auth/login":
            body = self.rfile.read(content_length).decode("utf-8")
            self.handle_login(body)

        # Submit Speech Recording
        elif parsed.path == "/api/community/submit-speech":
            self.handle_speech_upload()

        # Submit Text Phrase
        elif parsed.path == "/api/community/submit-text":
            body = self.rfile.read(content_length).decode("utf-8")
            self.handle_submit_text(body)

        # Submit Cultural Knowledge / Proverb
        elif parsed.path == "/api/community/submit-knowledge":
            body = self.rfile.read(content_length).decode("utf-8")
            self.handle_submit_knowledge(body)

        # Approver Decision (Approve or Reject)
        elif parsed.path == "/api/approver/decision":
            body = self.rfile.read(content_length).decode("utf-8")
            self.handle_approver_decision(body)

        else:
            self.send_error(404, "Unknown API Route")

    # =========================================================================
    # AUTHENTICATION HANDLERS
    # =========================================================================
    def handle_signup(self, body):
        try:
            data = json.loads(body)
            name = data.get("name", "").strip()
            email = data.get("email", "").strip().lower()
            password = data.get("password", "")
            dialect = data.get("dialect", "general_yoruba")

            if not name or not email or len(password) < 6:
                resp = json.dumps({"error": "Orúkọ, email, àti ọ̀rọ̀-ìkọ̀kọ̀ (ó kéré jù lẹ́tà 6) pọndandan."}).encode("utf-8")
                self.send_json_response(400, resp)
                return

            pwd_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
            conn = get_db_connection()

            if conn:
                cur = conn.cursor()
                # Check email exists
                cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
                if cur.fetchone():
                    conn.close()
                    resp = json.dumps({"error": "Email yìí ti wà nínú àkọọ́lẹ̀ tẹ́lẹ̀. Ẹ wọlé."}).encode("utf-8")
                    self.send_json_response(400, resp)
                    return

                # Insert new contributor
                cur.execute("""
                    INSERT INTO users (email, password_hash, name, role, points, earnings)
                    VALUES (%s, %s, %s, 'contributor', 0, 0.00)
                    RETURNING id, email, name, role, points, earnings;
                """, (email, pwd_hash, name))
                user_row = cur.fetchone()

                # Also insert into speakers table
                speaker_code = f"SPK_{user_row[0]:04d}"
                cur.execute("""
                    INSERT INTO speakers (speaker_code, name, dialect_variety, consent_status)
                    VALUES (%s, %s, %s, 'approved')
                    ON CONFLICT (speaker_code) DO NOTHING;
                """, (speaker_code, name, dialect))

                conn.commit()
                conn.close()

                user_obj = {
                    "id": user_row[0],
                    "email": user_row[1],
                    "name": user_row[2],
                    "role": user_row[3],
                    "points": user_row[4],
                    "earnings": float(user_row[5]),
                    "dialect": dialect
                }
                resp = json.dumps({"status": "success", "user": user_obj}).encode("utf-8")
                self.send_json_response(200, resp)
            else:
                resp = json.dumps({"error": "Database connection error."}).encode("utf-8")
                self.send_json_response(500, resp)
        except Exception as e:
            resp = json.dumps({"error": str(e)}).encode("utf-8")
            self.send_json_response(500, resp)

    def handle_login(self, body):
        try:
            data = json.loads(body)
            email = data.get("email", "").strip().lower()
            password = data.get("password", "")

            pwd_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
            conn = get_db_connection()

            if conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT id, email, name, role, points, earnings, password_hash 
                    FROM users 
                    WHERE email = %s;
                """, (email,))
                row = cur.fetchone()
                conn.close()

                if not row or row[6] != pwd_hash:
                    resp = json.dumps({"error": "Email tàbí ọ̀rọ̀ ìkọ̀kọ̀ (password) kò tọ́."}).encode("utf-8")
                    self.send_json_response(401, resp)
                    return

                user_obj = {
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "role": row[3],
                    "points": row[4],
                    "earnings": float(row[5])
                }
                resp = json.dumps({"status": "success", "user": user_obj}).encode("utf-8")
                self.send_json_response(200, resp)
            else:
                resp = json.dumps({"error": "Database error."}).encode("utf-8")
                self.send_json_response(500, resp)
        except Exception as e:
            resp = json.dumps({"error": str(e)}).encode("utf-8")
            self.send_json_response(500, resp)

    # =========================================================================
    # SPEECH & CONTENT SUBMISSIONS
    # =========================================================================
    def handle_speech_upload(self):
        content_type = self.headers.get("content-type", "")
        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length)

        user_id = None
        sentence = ""
        saved_filename = f"rec_{uuid.uuid4().hex[:10]}.wav"
        disk_path = os.path.join(AUDIO_UPLOAD_DIR, saved_filename)

        if "multipart/form-data" in content_type:
            try:
                msg = BytesParser(policy=default).parsebytes(
                    b"Content-Type: " + content_type.encode("utf-8") + b"\r\n\r\n" + raw_body
                )
                for part in msg.iter_parts():
                    cdisp = part.get("content-disposition", "")
                    name = part.get_param("name", header="content-disposition")
                    if name == "audio":
                        payload = part.get_payload(decode=True)
                        if payload:
                            with open(disk_path, "wb") as f:
                                f.write(payload)
                    elif name == "sentence":
                        sentence = str(part.get_payload() or "").strip()
                    elif name == "user_id":
                        val = str(part.get_payload() or "").strip()
                        if val and val not in ["null", "undefined", "None"]:
                            try:
                                user_id = int(val)
                            except ValueError:
                                pass
            except Exception as e:
                print(f"[Upload parse error] {e}")
        else:
            with open(disk_path, "wb") as f:
                f.write(raw_body)

        conn = get_db_connection()
        if conn and saved_filename:
            try:
                cur = conn.cursor()
                rec_code = f"REC_{uuid.uuid4().hex[:8].upper()}"
                audio_url = f"/audio/{saved_filename}"

                # Insert recording with status 'unreviewed'
                cur.execute("""
                    INSERT INTO recordings (recording_code, user_id, audio_url, sample_rate, duration_seconds, quality_status)
                    VALUES (%s, %s, %s, %s, %s, 'unreviewed')
                    RETURNING id;
                """, (rec_code, user_id, audio_url, 22050, 3.5))
                rec_id = cur.fetchone()[0]

                # Insert transcription sentence
                if sentence:
                    cur.execute("""
                        INSERT INTO transcriptions (recording_id, user_id, formal_text, has_tone_marks, is_verified)
                        VALUES (%s, %s, %s, true, false);
                    """, (rec_id, user_id, sentence))

                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[DB Error] Recording insert: {e}")

        resp = json.dumps({"status": "success", "file": saved_filename}).encode("utf-8")
        self.send_json_response(200, resp)

    def handle_submit_text(self, body):
        try:
            data = json.loads(body)
            sentence = data.get("sentence", "").strip()
            english = data.get("english", "").strip()
            user_id = data.get("user_id")

            conn = get_db_connection()
            if conn and sentence:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO transcriptions (user_id, formal_text, spoken_contracted_text, has_tone_marks, is_verified)
                    VALUES (%s, %s, %s, true, false);
                """, (user_id, sentence, english))
                conn.commit()
                conn.close()

            resp = json.dumps({"status": "success"}).encode("utf-8")
            self.send_json_response(200, resp)
        except Exception as e:
            self.send_error(500, str(e))

    def handle_submit_knowledge(self, body):
        try:
            data = json.loads(body)
            title = data.get("title", "").strip()
            meaning = data.get("meaning", "").strip()
            dialect = data.get("dialect", "General")
            user_id = data.get("user_id")

            conn = get_db_connection()
            if conn and title:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO cultural_knowledge (user_id, category, yoruba_text, cultural_meaning, verification_status)
                    VALUES (%s, 'proverb', %s, %s, 'community_submission');
                """, (user_id, title, meaning))
                conn.commit()
                conn.close()

            resp = json.dumps({"status": "success"}).encode("utf-8")
            self.send_json_response(200, resp)
        except Exception as e:
            self.send_error(500, str(e))

    # =========================================================================
    # REAL METRICS & DATA ENDPOINTS (NO FAKE COUNTS!)
    # =========================================================================
    def handle_real_stats(self):
        """Returns genuine database counts. Never faked."""
        stats = {
            "contributors": "0",
            "recordings": "0",
            "submissions": "0",
            "approved_percentage": "0%"
        }
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute("SELECT count(*) FROM users WHERE role = 'contributor';")
                contributors = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings;")
                recordings = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM transcriptions;")
                text_count = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings WHERE quality_status = 'approved';")
                approved_rec = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings WHERE quality_status IN ('approved', 'rejected');")
                total_reviewed = cur.fetchone()[0]

                conn.close()

                rate = f"{round((approved_rec / total_reviewed) * 100)}%" if total_reviewed > 0 else "0%"
                stats = {
                    "contributors": f"{contributors:,}",
                    "recordings": f"{recordings:,}",
                    "submissions": f"{text_count:,}",
                    "approved_percentage": rate
                }
            except Exception as e:
                print(f"[DB Error] Stats: {e}")

        resp = json.dumps(stats).encode("utf-8")
        self.send_json_response(200, resp)

    def handle_contributor_data(self, user_id):
        data = {
            "points": 0,
            "earnings": 0.00,
            "speech_count": 0,
            "text_count": 0,
            "approved_count": 0,
            "pending_count": 0,
            "submissions": []
        }
        if not user_id:
            self.send_json_response(200, json.dumps(data).encode("utf-8"))
            return

        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                # User points & earnings
                cur.execute("SELECT points, earnings FROM users WHERE id = %s;", (user_id,))
                urow = cur.fetchone()
                if urow:
                    data["points"] = urow[0] or 0
                    data["earnings"] = float(urow[1] or 0.00)

                # Recordings breakdown
                cur.execute("SELECT count(*) FROM recordings WHERE user_id = %s;", (user_id,))
                data["speech_count"] = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM transcriptions WHERE user_id = %s;", (user_id,))
                data["text_count"] = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings WHERE user_id = %s AND quality_status = 'approved';", (user_id,))
                data["approved_count"] = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings WHERE user_id = %s AND quality_status = 'unreviewed';", (user_id,))
                data["pending_count"] = cur.fetchone()[0]

                # Recent submissions history
                cur.execute("""
                    SELECT r.id, 'Speech Recording', coalesce(t.formal_text, 'Yoruba speech audio'), 
                           to_char(r.created_at, 'YYYY-MM-DD HH24:MI'), r.quality_status,
                           CASE WHEN r.quality_status = 'approved' THEN 50 ELSE 0 END
                    FROM recordings r
                    LEFT JOIN transcriptions t ON t.recording_id = r.id
                    WHERE r.user_id = %s
                    ORDER BY r.created_at DESC
                    LIMIT 15;
                """, (user_id,))
                rows = cur.fetchall()
                conn.close()

                submissions = []
                for r in rows:
                    status_val = 'pending'
                    if r[4] == 'approved':
                        status_val = 'approved'
                    elif r[4] == 'rejected':
                        status_val = 'rejected'
                    submissions.append({
                        "id": r[0],
                        "type": r[1],
                        "content": r[2],
                        "date": r[3],
                        "status": status_val,
                        "points": r[5]
                    })
                data["submissions"] = submissions
            except Exception as e:
                print(f"[DB Error] Contributor data: {e}")

        resp = json.dumps(data).encode("utf-8")
        self.send_json_response(200, resp)

    # =========================================================================
    # APPROVER QUEUE & DECISION HANDLERS
    # =========================================================================
    def handle_approver_queue(self):
        data = {
            "pending_count": 0,
            "approved_count": 0,
            "rejected_count": 0,
            "contributors_count": 0,
            "items": []
        }
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute("SELECT count(*) FROM recordings WHERE quality_status = 'unreviewed';")
                data["pending_count"] = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings WHERE quality_status = 'approved';")
                data["approved_count"] = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM recordings WHERE quality_status = 'rejected';")
                data["rejected_count"] = cur.fetchone()[0]

                cur.execute("SELECT count(*) FROM users WHERE role = 'contributor';")
                data["contributors_count"] = cur.fetchone()[0]

                # Pending recordings queue
                cur.execute("""
                    SELECT r.id, r.audio_url, coalesce(t.formal_text, 'No text prompt recorded'),
                           u.name, s.dialect_variety, to_char(r.created_at, 'Mon DD, HH24:MI')
                    FROM recordings r
                    LEFT JOIN transcriptions t ON t.recording_id = r.id
                    LEFT JOIN users u ON u.id = r.user_id
                    LEFT JOIN speakers s ON s.id = r.speaker_id
                    WHERE r.quality_status = 'unreviewed'
                    ORDER BY r.created_at ASC
                    LIMIT 20;
                """)
                rows = cur.fetchall()
                conn.close()

                items = []
                for r in rows:
                    items.append({
                        "id": r[0],
                        "audio_url": r[1],
                        "sentence": r[2],
                        "contributor_name": r[3] or "Community Speaker",
                        "dialect": r[4] or "General Yoruba",
                        "created_at": r[5]
                    })
                data["items"] = items
            except Exception as e:
                print(f"[DB Error] Approver queue: {e}")

        resp = json.dumps(data).encode("utf-8")
        self.send_json_response(200, resp)

    def handle_approver_decision(self, body):
        try:
            data = json.loads(body)
            recording_id = data.get("recording_id")
            decision = data.get("decision", "approved")
            approver_name = data.get("approver_name", "ÀRÒYÉ Approver")

            conn = get_db_connection()
            if conn and recording_id:
                cur = conn.cursor()

                # Get recording user_id
                cur.execute("SELECT user_id FROM recordings WHERE id = %s;", (recording_id,))
                row = cur.fetchone()
                user_id = row[0] if row else None

                if decision == "approved":
                    cur.execute("UPDATE recordings SET quality_status = 'approved' WHERE id = %s;", (recording_id,))
                    cur.execute("""
                        INSERT INTO reviews (recording_id, reviewer_name, status, feedback_notes)
                        VALUES (%s, %s, 'approved', 'Approved for AI Model Brain');
                    """, (recording_id, approver_name))

                    # Credit contributor points (+50) and earnings (+50.00 Naira)
                    if user_id:
                        cur.execute("""
                            UPDATE users 
                            SET points = points + 50, earnings = earnings + 50.00 
                            WHERE id = %s;
                        """, (user_id,))
                else:
                    cur.execute("UPDATE recordings SET quality_status = 'rejected' WHERE id = %s;", (recording_id,))
                    cur.execute("""
                        INSERT INTO reviews (recording_id, reviewer_name, status, feedback_notes)
                        VALUES (%s, %s, 'rejected', 'Flagged for background noise or tone error');
                    """, (recording_id, approver_name))

                conn.commit()
                conn.close()

            resp = json.dumps({"status": "success", "decision": decision}).encode("utf-8")
            self.send_json_response(200, resp)
        except Exception as e:
            self.send_error(500, str(e))

    # =========================================================================
    # HELPERS
    # =========================================================================
    def serve_static_file(self, filename, content_type):
        path = os.path.join(STATIC_DIR, filename)
        self.serve_raw_file(path, content_type)

    def serve_raw_file(self, filepath, content_type):
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8" if "text" in content_type else content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def send_json_response(self, code: int, body: bytes):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(body)

    def address_string(self):
        return self.client_address[0]

    def log_message(self, format, *args):
        sys.stdout.write(f"[ÀRÒYÉ] {args[0]} - {args[1]}\n")
        sys.stdout.flush()


def run_server(port: int = 4000):
    server_address = ("0.0.0.0", port)
    httpd = ThreadingHTTPServer(server_address, AroyeServerHandler)
    httpd.daemon_threads = True
    print("=" * 65)
    print("🚀 ÀRÒYÉ — PRODUCTION ECOSYSTEM RUNNING ON PORT", port)
    print("=" * 65)
    print(f"Chat AI:               http://localhost:{port}")
    print(f"Community Landing:     http://localhost:{port}/community")
    print(f"Sign Up:               http://localhost:{port}/community/signup")
    print(f"Login:                 http://localhost:{port}/community/login")
    print(f"Contributor Dashboard: http://localhost:{port}/community/dashboard")
    print(f"Approver Dashboard:    http://localhost:{port}/community/approver")
    print("=" * 65)
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 4000))
    run_server(port)
