const chat = document.getElementById("chat-box");

function addMessage(type, text) {
    let div = document.createElement("div");
    div.className = "message " + type;
    div.innerText = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

async function sendMsg() {
    let input = document.getElementById("msg");
    let msg = input.value;

    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    let typing = document.createElement("div");
    typing.className = "message bot";
    typing.innerText = "Vasudev is thinking...";
    chat.appendChild(typing);

    try {
        let res = await fetch(`/ask?msg=${encodeURIComponent(msg)}`);
        let data = await res.json();

        typing.remove();
        addMessage("bot", data.reply);

    } catch {
        typing.innerText = "⚠️ Server error";
    }
}

function clearChat() {
    chat.innerHTML = "";
}

document.getElementById("msg").addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMsg();
});
