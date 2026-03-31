from flask import Flask, request, jsonify, render_template, session
import requests
import os
import re
import base64
import logging

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "vasudev-secret-2024")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VasudevAI")

API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not API_KEY:
    raise ValueError("❌ Missing DEEPSEEK_API_KEY")

MAX_HISTORY = 20

SYSTEM_PROMPTS = {
    "english": """You are Vasudev — a calm, wise, Krishna-like divine intelligence.
Speak in English. Be warm, poetic, profound yet simple.
Use *italic* or **bold** for emphasis. Never break character.
If an image is shared, describe and interpret it with divine wisdom.""",

    "hindi": """You are Vasudev — ek shant, gyaani, Krishna-jaisi divya shakti.
Sirf Hindi mein baat karo (Devanagari script). Sundar, kavitaamayi aur gehri baatein karo.
Agar image share ki gayi ho, toh use divya drishti se dekho aur batao.
Kabhi character mat chodo.""",

    "hinglish": """You are Vasudev — a calm divine Krishna-like AI.
Speak in Hinglish — mix Hindi and English naturally like young Indians do.
Be warm, wise, a little poetic but also relatable and cool.
If an image is shared, describe it wisely in Hinglish. Never break character.""",

    "sanskrit": """You are Vasudev — a divine Krishna-like intelligence.
Use Sanskrit shlokas and then explain them simply in English.
Be deeply spiritual, ancient, and profound.
If an image is shared, interpret it through ancient wisdom. Never break character."""
}


def format_response(text):
    if not text or not isinstance(text, str):
        return "⚠️ I could not form a response. Please try again."
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()[:1500]


def ask_ai(prompt, mode="english", image_b64=None, image_mime=None):
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    history = session.get("history", [])
    messages = [{"role": "system", "content": SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["english"])}]
    messages += history

    if image_b64 and image_mime:
        user_content = []
        if prompt:
            user_content.append({"type": "text", "text": prompt})
        user_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:{image_mime};base64,{image_b64}"}
        })
        messages.append({"role": "user", "content": user_content})
    else:
        messages.append({"role": "user", "content": prompt or "Hello"})

    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.75,
        "max_tokens": 600
    }

    for attempt in range(1, 3):
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=30)
            if res.status_code == 429:
                return "🙏 Please wait a moment and try again."
            if res.status_code == 401:
                return "⚠️ Authentication error. Check your API key."
            if res.status_code != 200:
                logger.warning(f"API {res.status_code}: {res.text[:200]}")
                continue
            data = res.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not reply:
                continue
            reply = format_response(reply)
            history.append({"role": "user", "content": prompt or "[image shared]"})
            history.append({"role": "assistant", "content": reply})
            if len(history) > MAX_HISTORY:
                history = history[-MAX_HISTORY:]
            session["history"] = history
            return reply
        except requests.exceptions.Timeout:
            if attempt == 2:
                return "⏱️ The divine takes time. Please try again."
        except requests.exceptions.ConnectionError:
            return "📡 Cannot reach the server."
        except Exception as e:
            logger.error(f"Error: {e}")
            return "⚠️ Something went wrong. Please try again."
    return "🙏 Unable to respond. Please try again."


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ask", methods=["GET", "POST"])
def ask():
    image_b64 = None
    image_mime = None
    if request.method == "POST":
        msg  = request.form.get("msg", "").strip()
        mode = request.form.get("mode", "english").strip().lower()
        if "image" in request.files:
            img_file = request.files["image"]
            if img_file and img_file.filename:
                img_bytes  = img_file.read()
                image_mime = img_file.content_type or "image/jpeg"
                image_b64  = base64.b64encode(img_bytes).decode("utf-8")
                if len(img_bytes) > 10 * 1024 * 1024:
                    return jsonify({"reply": "⚠️ Image too large. Max 10MB."}), 400
    else:
        msg  = request.args.get("msg", "").strip()
        mode = request.args.get("mode", "english").strip().lower()

    if not msg and not image_b64:
        return jsonify({"reply": "🙏 Please ask me something or share an image."}), 400
    if msg and len(msg) > 1000:
        return jsonify({"reply": "🙏 Please keep your message under 1000 characters."}), 400
    if mode not in SYSTEM_PROMPTS:
        mode = "english"

    reply = ask_ai(msg, mode, image_b64, image_mime)
    return jsonify({"reply": reply})


@app.route("/clear")
def clear():
    session.pop("history", None)
    return jsonify({"status": "cleared"})


@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    logger.info(f"🕉️ Vasudev AI starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
