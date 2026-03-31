const chat = document.getElementById(“chat-box”);
const input = document.getElementById(“msg”);

let isSending = false;
let lastMessage = “”;
let messageCount = 0;

// ── Smooth scroll ──
function scrollBottom() {
requestAnimationFrame(() => {
chat.scrollTo({ top: chat.scrollHeight, behavior: “smooth” });
});
}

// ── Create avatar HTML ──
function getAvatar(type) {
return `<div class="avatar">${type === "user" ? "👤" : "🕉️"}</div>`;
}

// ── Add message with animation ──
function addMessage(type, text, isHTML = false) {
if (!text || typeof text !== “string”) text = “⚠️ Invalid message”;

messageCount++;

const wrapper = document.createElement(“div”);
wrapper.className = `msg ${type}`;
wrapper.style.animationDelay = “0ms”;

const bubble = document.createElement(“div”);
bubble.className = “bubble”;

if (isHTML) {
bubble.innerHTML = text;
} else {
// Render line breaks and basic markdown-style bold
bubble.innerHTML = formatText(text);
}

if (type === “user”) {
wrapper.appendChild(bubble);
wrapper.appendChild(createAvatarEl(“👤”));
} else {
wrapper.appendChild(createAvatarEl(“🕉️”));
wrapper.appendChild(bubble);
}

chat.appendChild(wrapper);
scrollBottom();
return wrapper;
}

// ── Format text (basic markdown) ──
function formatText(text) {
return text
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”)
.replace(/**(.*?)**/g, “<strong>$1</strong>”)
.replace(/*(.*?)*/g, “<em>$1</em>”)
.replace(/`(.*?)`/g, “<code>$1</code>”)
.replace(/\n/g, “<br>”);
}

// ── Create avatar element ──
function createAvatarEl(emoji) {
const el = document.createElement(“div”);
el.className = “avatar”;
el.textContent = emoji;
return el;
}

// ── Typing indicator ──
function createTyping() {
const wrapper = document.createElement(“div”);
wrapper.className = “msg bot”;

const avatar = createAvatarEl(“🕉️”);

const bubble = document.createElement(“div”);
bubble.className = “bubble”;
bubble.innerHTML = ` <div class="typing-dots"> <span></span><span></span><span></span> </div>`;

wrapper.appendChild(avatar);
wrapper.appendChild(bubble);
chat.appendChild(wrapper);
scrollBottom();
return wrapper;
}

// ── Disable / enable input ──
function setInputState(disabled) {
input.disabled = disabled;
const btn = document.querySelector(”.send-btn”);
if (btn) {
btn.style.opacity = disabled ? “0.45” : “1”;
btn.style.pointerEvents = disabled ? “none” : “auto”;
}
}

// ── Send message ──
async function sendMsg() {
if (isSending) return;

const msg = input.value.trim();
if (!msg) {
shakeSendBtn();
return;
}

isSending = true;
lastMessage = msg;

addMessage(“user”, msg);
input.value = “”;
input.blur();
setInputState(true);

const typing = createTyping();

try {
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 20000);

```
const res = await fetch(`/ask?msg=${encodeURIComponent(msg)}`, {
  method: "GET",
  signal: controller.signal
});

clearTimeout(timeout);

if (!res.ok) throw new Error(`HTTP ${res.status}`);

const data = await res.json();
typing.remove();

const reply = data?.reply;
if (!reply) {
  addMessage("bot", "⚠️ I received an empty response. Please try again.");
} else {
  addMessage("bot", reply);
}
```

} catch (err) {
typing.remove();

```
if (err.name === "AbortError") {
  addMessage("bot", "⏱️ The response took too long. Please try again.");
} else if (!navigator.onLine) {
  addMessage("bot", "📡 You appear to be offline. Check your connection.");
} else {
  addMessage("bot", "🌐 Something went wrong. Please try again.");
}

console.error("[Vasudev AI]", err);
```

}

isSending = false;
setInputState(false);
input.focus();
}

// ── Shake send button on empty submit ──
function shakeSendBtn() {
const btn = document.querySelector(”.send-btn”);
if (!btn) return;
btn.classList.add(“shake”);
setTimeout(() => btn.classList.remove(“shake”), 400);
}

// ── Enter key ──
input.addEventListener(“keydown”, (e) => {
if (e.key === “Enter” && !e.shiftKey) {
e.preventDefault();
sendMsg();
}
});

// ── iOS keyboard scroll fix ──
input.addEventListener(“focus”, () => {
setTimeout(scrollBottom, 350);
});

// ── Character counter / input glow ──
input.addEventListener(“input”, () => {
const wrap = document.querySelector(”.input-wrap”);
if (!wrap) return;
if (input.value.length > 0) {
wrap.classList.add(“has-text”);
} else {
wrap.classList.remove(“has-text”);
}
});

// ── Clear chat ──
function clearChat() {
chat.innerHTML = “”;
messageCount = 0;
}

// ── Retry last message ──
function retry() {
if (lastMessage && !isSending) {
input.value = lastMessage;
sendMsg();
}
}

// ── Welcome message on load ──
window.addEventListener(“DOMContentLoaded”, () => {
setTimeout(() => {
addMessage(
“bot”,
“Namaste 🙏 I am **Vasudev AI** — ask me anything. Wisdom, knowledge, or guidance awaits.”
);
}, 400);
});

// ── Shake keyframe (injected) ──
const shakeStyle = document.createElement(“style”);
shakeStyle.textContent = `.send-btn.shake { animation: shake 0.35s cubic-bezier(.36,.07,.19,.97) both; } @keyframes shake { 10%, 90% { transform: translateX(-2px) scale(1.05); } 30%, 70% { transform: translateX(3px)  scale(1.05); } 50%       { transform: translateX(-3px) scale(1.05); } } .input-wrap.has-text { border-color: rgba(201,168,76,0.38) !important; } .bubble code { background: rgba(107,77,255,0.2); border: 1px solid rgba(107,77,255,0.3); border-radius: 5px; padding: 1px 6px; font-family: 'Fira Code', monospace; font-size: 13px; color: #c9b8ff; } .bubble strong { color: var(--gold-light); font-weight: 600; } .bubble em { color: #b8b0d0; font-style: italic; }`;
document.head.appendChild(shakeStyle);
