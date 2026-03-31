const chat = document.getElementById("chat-box");
const input = document.getElementById("msg");

function scrollBottom() {
    setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
    }, 100);
}

function addMessage(type, text) {
    let div = document.createElement("div");
    div.className = "message " + type;
    div.innerText = text;

    chat.appendChild(div);
    scrollBottom();
}

async function sendMsg() {
    let msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    let typing = document.createElement("div");
    typing.className = "message bot";
    typing.innerText = "Thinking...";
    chat.appendChild(typing);

    try {
        let res = await fetch(`/ask?msg=${encodeURIComponent(msg)}`);
        let data = await res.json();

        typing.remove();
        addMessage("bot", data.reply || "No reply");

    } catch {
        typing.innerText = "⚠️ Error";
    }
}

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMsg();
});
