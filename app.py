from flask import Flask, request, jsonify, render_template
import requests
import os
import re
import logging

# ── App setup ──
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VasudevAI")

# ── API key ──
API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not API_KEY:
    raise ValueError("❌ Missing DEEPSEEK_API_KEY environment variable")

# ── System prompt ──
SYSTEM_PROMPT = """You are Vasudev — a calm, wise, Krishna-like divine intelligence.
Speak with warmth, depth, and poetic beauty. Be concise but profound.
Use simple language. Avoid jargon. Never break character.
You may use *italic* or **bold** for emphasis when it adds meaning."""

# ── Format response ──
def format_response(text):
    if not text or not isinstance(text, str):
        return "⚠️ I could not form a response. Please try again."

    # Strip non-printable characters but keep unicode (emojis, Sanskrit etc.)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Collapse excessive whitespace/newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)

    return text.strip()[:1200]

# ── Call DeepSeek API ──
def ask_ai(prompt, retries=2):
    url = "https://api.deepseek.com/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt}
        ],
        "temperature": 0.75,
        "max_tokens": 500,
        "stream": False
    }

    for attempt in range(1, retries + 1):
        try:
            logger.info(f"Attempt {attempt} | prompt: {prompt[:60]}...")
            res = requests.post(url, headers=headers, json=payload, timeout=25)

            if res.status_code == 429:
                return "🙏 I am being called too frequently. Please wait a moment and try again."

            if res.status_code == 401:
                logger.error("Invalid API key")
                return "⚠️ Authentication error. Please check the API key."

            if res.status_code != 200:
                logger.warning(f"API returned {res.status_code}: {res.text[:200]}")
                continue  # retry

            data = res.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            if not reply:
                logger.warning("Empty reply from API")
                continue

            return format_response(reply)

        except requests.exceptions.Timeout:
            logger.warning(f"Attempt {attempt} timed out")
            if attempt == retries:
                return "⏱️ The divine takes time. Please try again shortly."

        except requests.exceptions.ConnectionError:
            logger.error("Connection error")
            return "📡 Cannot reach the server. Check your connection."

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return "⚠️ Something went wrong. Please try again."

    return "🙏 I was unable to respond. Please try again."

# ── Routes ──
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/ask")
def ask():
    msg = request.args.get("msg", "").strip()

    if not msg:
        return jsonify({"reply": "🙏 Please ask me something."}), 400

    if len(msg) > 1000:
        return jsonify({"reply": "🙏 Your message is too long. Please keep it under 1000 characters."}), 400

    reply = ask_ai(msg)
    return jsonify({"reply": reply})

# ── Health check (useful for deployment) ──
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "Vasudev AI"}), 200

# ── Run ──
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    logger.info(f"🕉️  Vasudev AI starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
