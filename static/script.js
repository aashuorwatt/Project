const chat = document.getElementById("chat-box");
const input = document.getElementById("msg");

let isSending = false; // 🚫 prevent spam

// 📜 Smooth scroll (iOS safe)
function scrollBottom() {
    requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
    });
}

// 💬 Add message safely
function addMessage(type, text) {
    if (!text || typeof text !== "string") {
        text = "⚠️ Invalid message";
    }

    const div = document.createElement("div");
    div.className = "message " + type;
    div.textContent = text;

    chat.appendChild(div);
    scrollBottom();
}

// ⏳ Typing indicator
function createTyping() {
    const div = document.createElement("div");
    div.className = "message bot typing";
    div.innerHTML = `
        <span></span><span></span><span></span>
    `;
    chat.appendChild(div);
    scrollBottom();
    return div;
}

// 🎯 Send message
async function sendMsg() {
    if (isSending) return; // 🚫 block spam

    let msg = input.value.trim();
    if (!msg) return;

    isSending = true;

    addMessage("user", msg);
    input.value = "";
    input.blur();

    const typing = createTyping();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const res = await fetch(`/ask?msg=${encodeURIComponent(msg)}`, {
            method: "GET",
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) throw new Error("Bad response");

        const data = await res.json();

        typing.remove();

        if (!data || !data.reply) {
            addMessage("bot", "⚠️ Empty response");
        } else {
            addMessage("bot", data.reply);
        }

    } catch (err) {
        typing.remove();

        if (err.name === "AbortError") {
            addMessage("bot", "⏱️ Timeout. Try again.");
        } else {
            addMessage("bot", "🌐 Network error");
        }

        console.error(err);
    }

    isSending = false;
}

// ⌨️ Enter key (fixed iOS)
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
    }
});

// 📱 Focus fix (iOS keyboard)
input.addEventListener("focus", () => {
    setTimeout(scrollBottom, 300);
});

// 🧹 Clear chat safely
function clearChat() {
    chat.innerHTML = "";
}

// 🔁 Retry last message (optional future feature)
let lastMessage = "";
function retry() {
    if (lastMessage) {
        input.value = lastMessage;
        sendMsg();
    }
}
