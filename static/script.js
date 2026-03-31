const chat = document.getElementById("chat-box");
const input = document.getElementById("msg");

// 💾 Load saved chat
window.onload = () => {
    let saved = localStorage.getItem("chat");
    if (saved) chat.innerHTML = saved;
    input.focus();
};

// 💬 Add message
function addMessage(type, text) {
    let div = document.createElement("div");
    div.className = "message " + type;
    div.innerText = text;

    chat.appendChild(div);
    saveChat();
    scrollBottom();
}

// 💾 Save chat
function saveChat() {
    localStorage.setItem("chat", chat.innerHTML);
}

// 📜 Scroll
function scrollBottom() {
    setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
    }, 100);
}

// ⚡ Typing animation
function typingAnimation() {
    let div = document.createElement("div");
    div.className = "message bot";
    div.innerHTML = "Thinking<span class='dots'></span>";
    chat.appendChild(div);
    scrollBottom();
    return div;
}

// 🚀 Send
async function sendMsg() {
    let msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    let typing = typingAnimation();

    try {
        let res = await fetch(`/ask?msg=${encodeURIComponent(msg)}`);
        let data = await res.json();

        typing.remove();

        if (!data.reply) {
            addMessage("bot", "⚠️ No response");
            return;
        }

        addMessage("bot", data.reply);

    } catch {
        typing.innerText = "⚠️ Error";
    }
}

// ⚡ Quick message
function quickMsg(text) {
    input.value = text;
    sendMsg();
}

// 🧹 Clear
function clearChat() {
    chat.innerHTML = "";
    localStorage.removeItem("chat");
}

// ⌨️ Enter key
input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMsg();
});
