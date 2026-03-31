const chat = document.getElementById("chat-box");

// 💬 Add message
function addMessage(type, text) {
    let div = document.createElement("div");
    div.className = "message " + type;
    div.innerText = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// 🚀 Send message
async function sendMsg() {
    let input = document.getElementById("msg");
    let msg = input.value;

    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    // typing animation
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

// 🧹 Clear chat
function clearChat() {
    chat.innerHTML = "";
}

// ⌨️ Enter key support
document.getElementById("msg").addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMsg();
});

// 📱 Auto focus
document.getElementById("msg").focus();


// 🌌 PARTICLE BACKGROUND
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for (let i = 0; i < 60; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.y += 0.3;
        if (p.y > canvas.height) p.y = 0;
    });

    requestAnimationFrame(draw);
}

draw();
