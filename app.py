from flask import Flask, request, jsonify, render_template
import requests
import os
import re

app = Flask(__name__)

API_KEY = os.getenv("DEEPSEEK_API_KEY")

if not API_KEY:
    raise ValueError("Missing API Key")

def format_response(text):
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:800]

def ask_ai(prompt):
    url = "https://api.deepseek.com/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are Vasudev, a calm divine Krishna-like AI. Speak wisely, peacefully and beautifully."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 400
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=25)

        if res.status_code != 200:
            return "⚠️ API Error"

        data = res.json()

        reply = data["choices"][0]["message"]["content"]
        return format_response(reply)

    except:
        return "⚠️ Server Busy. Try again."

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/ask")
def ask():
    msg = request.args.get("msg")

    if not msg:
        return jsonify({"reply": "No message"})

    reply = ask_ai(msg)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
